const crypto = require('crypto');
const db = require('../../../models');
const { getRazorpayInstance } = require('../../../config/razorpay');
const { ApiError } = require('../../../middleware/errorHandler');
const notificationService = require('../../notification/services/notificationService');

const activateAgreementAfterDepositIfNeeded = async (transaction) => {
  if (transaction.type !== 'deposit' || transaction.status !== 'completed') {
    return null;
  }

  const agreement = await db.Agreement.findByPk(transaction.agreement_id);
  if (!agreement || agreement.status !== 'pending_deposit') {
    return agreement;
  }

  await agreement.update({
    status: 'started',
    started_at: new Date()
  });

  await db.AgreementEvent.create({
    agreement_id: agreement.agreement_id,
    actor_id: transaction.paid_by,
    event_type: 'deposit_paid',
    title: 'Deposit paid and agreement started',
    description: 'Tenant paid the deposit. Agreement is now started.',
    metadata: {
      transaction_id: transaction.transaction_id,
      amount: transaction.amount
    }
  });

  await notificationService.createNotification({
    user_id: agreement.owner_id,
    type: 'payment',
    title: 'Deposit received, agreement started',
    message: `Deposit payment received for agreement ${agreement.agreement_number || agreement.agreement_id}. The agreement is now started.`,
    metadata: {
      agreement_id: agreement.agreement_id,
      transaction_id: transaction.transaction_id
    },
    sendEmail: true
  });

  await notificationService.createNotification({
    user_id: agreement.tenant_id,
    type: 'payment',
    title: 'Agreement started',
    message: `Your deposit payment was received for agreement ${agreement.agreement_number || agreement.agreement_id}. The agreement is now started.`,
    metadata: {
      agreement_id: agreement.agreement_id,
      transaction_id: transaction.transaction_id
    },
    sendEmail: true
  });

  return agreement;
};

const buildTransactionHash = async (transaction) => {
  const previousTransaction = await db.Transaction.findOne({
    where: { agreement_id: transaction.agreement_id },
    order: [['created_at', 'DESC']]
  });

  const previousHash = previousTransaction?.hash || '';
  const payload = [
    previousHash,
    transaction.agreement_id,
    transaction.type,
    transaction.amount,
    transaction.status,
    transaction.razorpay_order_id || '',
    transaction.razorpay_payment_id || ''
  ].join('|');

  return {
    previous_hash: previousHash || null,
    hash: crypto.createHash('sha256').update(payload).digest('hex')
  };
};

const initiatePayment = async ({ agreement_id, amount, type = 'rent' }, user) => {
  const agreement = await db.Agreement.findByPk(agreement_id, {
    include: [{ model: db.Property, as: 'property' }]
  });

  if (!agreement) {
    throw ApiError.notFound('Agreement not found');
  }

  if (user.role === 'tenant' && agreement.tenant_id !== user.user_id) {
    throw ApiError.forbidden('You can only pay for your own agreement');
  }

  if (type === 'deposit' && !['pending_deposit', 'draft', 'rejected'].includes(agreement.status)) {
    throw ApiError.badRequest('Deposit can only be paid before the agreement starts');
  }

  const razorpay = getRazorpayInstance();
  if (!razorpay) {
    throw ApiError.internal('Razorpay is not configured');
  }

  const gstRate = parseFloat(process.env.DEFAULT_GST_RATE || 0);
  const gstAmount = (Number(amount) * gstRate) / 100;
  const totalAmount = Number(amount) + gstAmount;

  const order = await razorpay.orders.create({
    amount: Math.round(totalAmount * 100),
    currency: 'INR',
    receipt: `beaver_${agreement_id}_${Date.now()}`,
    notes: {
      agreement_id: String(agreement_id),
      user_id: String(user.user_id),
      payment_type: type
    }
  });

  const transaction = await db.Transaction.create({
    agreement_id,
    paid_by: user.user_id,
    type,
    amount,
    gst_amount: gstAmount,
    razorpay_order_id: order.id,
    status: 'pending',
    description: `${type} payment initiated`
  });

  const hashData = await buildTransactionHash(transaction);
  await transaction.update(hashData);

  return {
    order,
    transaction
  };
};

const verifyPayment = async ({ razorpay_order_id, razorpay_payment_id, razorpay_signature }, user) => {
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (generatedSignature !== razorpay_signature) {
    throw ApiError.badRequest('Invalid payment signature');
  }

  const transaction = await db.Transaction.findOne({ where: { razorpay_order_id } });
  if (!transaction) {
    throw ApiError.notFound('Transaction not found');
  }

  if (user.role === 'tenant' && transaction.paid_by !== user.user_id) {
    throw ApiError.forbidden('Unauthorized payment verification');
  }

  await transaction.update({
    razorpay_payment_id,
    razorpay_signature,
    status: 'completed',
    paid_at: new Date(),
    description: 'Payment completed successfully'
  });

  const hashData = await buildTransactionHash(transaction);
  await transaction.update(hashData);

  await activateAgreementAfterDepositIfNeeded(transaction);

  return transaction;
};

const handleWebhook = async ({ event, payload, rawBody, signature }) => {
  const bodyForSignature = rawBody || JSON.stringify(payload);
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
    .update(bodyForSignature)
    .digest('hex');

  if (signature !== expected) {
    throw ApiError.badRequest('Invalid webhook signature');
  }

  if (event === 'payment.captured') {
    const payment = payload.payment?.entity;
    if (!payment?.order_id) {
      return { processed: false };
    }

    const transaction = await db.Transaction.findOne({ where: { razorpay_order_id: payment.order_id } });
    if (!transaction) {
      return { processed: false };
    }

    await transaction.update({
      razorpay_payment_id: payment.id,
      status: 'completed',
      paid_at: new Date(payment.created_at * 1000)
    });

    const hashData = await buildTransactionHash(transaction);
    await transaction.update(hashData);
    await activateAgreementAfterDepositIfNeeded(transaction);
  }

  return { processed: true };
};

const refundPayment = async (agreementId, amount, reason, user) => {
  const depositTransaction = await db.Transaction.findOne({
    where: {
      agreement_id: agreementId,
      type: 'deposit',
      status: 'completed'
    },
    order: [['created_at', 'DESC']]
  });

  if (!depositTransaction || !depositTransaction.razorpay_payment_id) {
    throw ApiError.badRequest('No successful deposit payment found to refund');
  }

  const razorpay = getRazorpayInstance();
  if (!razorpay) {
    throw ApiError.internal('Razorpay is not configured');
  }

  // Create refund in Razorpay
  const refund = await razorpay.payments.refund(depositTransaction.razorpay_payment_id, {
    amount: Math.round(Number(amount) * 100),
    notes: {
      agreement_id: String(agreementId),
      reason: reason || 'Agreement closed or revoked',
      refund_by: String(user.user_id)
    }
  });

  // Log refund transaction
  const transaction = await db.Transaction.create({
    agreement_id: agreementId,
    paid_by: user.user_id, // Refund is technically performed by the person closing the agreement
    type: 'refund',
    amount: amount,
    gst_amount: 0,
    razorpay_payment_id: refund.id,
    status: 'completed',
    paid_at: new Date(),
    description: `Refund for deposit: ${reason || 'Agreement closed'}`
  });

  const hashData = await buildTransactionHash(transaction);
  await transaction.update(hashData);

  return transaction;
};

module.exports = {
  initiatePayment,
  verifyPayment,
  handleWebhook,
  refundPayment
};
