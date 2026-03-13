const { Op } = require('sequelize');
const db = require('../../../models');
const { ApiError } = require('../../../middleware/errorHandler');
const { getPaginationParams, getSortParams } = require('../../../utils/pagination');
const { generateAgreementPdf } = require('./agreementPdfService');
const notificationService = require('../../notification/services/notificationService');

const createAgreementEvent = async ({ agreement_id, actor_id = null, event_type, title, description = null, metadata = {} }) => {
  return db.AgreementEvent.create({
    agreement_id,
    actor_id,
    event_type,
    title,
    description,
    metadata
  });
};

const buildAgreementNumber = (agreement) => {
  const created = new Date(agreement.created_at || new Date());
  const yy = String(created.getFullYear()).slice(-2);
  const mm = String(created.getMonth() + 1).padStart(2, '0');
  const dd = String(created.getDate()).padStart(2, '0');

  return [
    'BVR',
    yy,
    mm,
    dd,
    `O${agreement.owner_id}`,
    `T${agreement.tenant_id}`,
    `P${agreement.property_id}`,
    `A${agreement.agreement_id}`
  ].join('-');
};

const listAgreements = async (query, user) => {
  const { page, limit, offset } = getPaginationParams(query);
  const { sort, order } = getSortParams(query, ['created_at', 'start_date', 'end_date', 'rent_amount', 'status']);

  const where = {};
  if (user.role === 'owner') {
    where.owner_id = user.user_id;
  }
  if (user.role === 'tenant') {
    where.tenant_id = user.user_id;
  }
  if (query.status) {
    where.status = query.status;
  }

  if (query.bucket === 'pending' && user.role === 'tenant') {
    where.status = { [Op.in]: ['draft', 'pending_deposit'] };
  }

  const result = await db.Agreement.findAndCountAll({
    where,
    include: [
      { model: db.Property, as: 'property' },
      { model: db.User, as: 'owner', attributes: ['user_id', 'full_name', 'email', 'profile_photo', 'role'] },
      { model: db.User, as: 'tenant', attributes: ['user_id', 'full_name', 'email', 'phone', 'profile_photo', 'role'] }
    ],
    order: [[sort, order]],
    offset,
    limit
  });

  return {
    data: result.rows,
    pagination: {
      total: result.count,
      page,
      limit,
      totalPages: Math.ceil(result.count / limit),
      hasNext: page * limit < result.count,
      hasPrev: page > 1
    }
  };
};

const getAgreementById = async (agreementId, user) => {
  const agreement = await db.Agreement.findByPk(agreementId, {
    include: [
      { model: db.Property, as: 'property' },
      { model: db.User, as: 'owner', attributes: ['user_id', 'full_name', 'email', 'profile_photo', 'role'] },
      { model: db.User, as: 'tenant', attributes: ['user_id', 'full_name', 'email', 'phone', 'profile_photo', 'role'] },
      { model: db.Transaction, as: 'transactions' }
    ]
  });

  if (!agreement) {
    throw ApiError.notFound('Agreement not found');
  }

  if (user.role === 'owner' && agreement.owner_id !== user.user_id) {
    throw ApiError.forbidden('You can only access your own agreements');
  }

  if (user.role === 'tenant' && agreement.tenant_id !== user.user_id) {
    throw ApiError.forbidden('You can only access your own agreement');
  }

  return agreement;
};

const getProfileCompleteness = (user) => {
  const fields = {
    full_name: !!user.full_name,
    phone: !!user.phone,
    address_line: !!user.address_line,
    city: !!user.city,
    state: !!user.state,
    pincode: !!user.pincode,
    date_of_birth: !!user.date_of_birth,
    gender: !!user.gender,
    bank_account_number: !!user.bank_account_number,
    bank_ifsc: !!user.bank_ifsc,
    bank_name: !!user.bank_name,
    // profile_photo: !!user.profile_photo
  };
  const completed = Object.values(fields).filter(Boolean).length;
  const total = Object.keys(fields).length;
  return {
    is_complete: completed === total,
    completed,
    total,
    missing: Object.entries(fields).filter(([, v]) => !v).map(([k]) => k),
    fields
  };
};

const createAgreement = async (payload, user) => {
  const property = await db.Property.findByPk(payload.property_id);
  if (!property) {
    throw ApiError.notFound('Property not found');
  }

  if (user.role === 'owner' && property.owner_id !== user.user_id) {
    throw ApiError.forbidden('You can only create agreements for your own properties');
  }

  const tenant = await db.User.findByPk(payload.tenant_id);
  if (!tenant || tenant.role !== 'tenant') {
    throw ApiError.badRequest('Tenant user is invalid');
  }

  const invite = payload.invite_id ? await db.Invite.findByPk(payload.invite_id) : null;

  if (invite && invite.used_by && invite.used_by !== tenant.user_id) {
    throw ApiError.badRequest('Invite is already accepted by a different tenant');
  }

  const agreement = await db.Agreement.create({
    ...payload,
    owner_id: property.owner_id,
    status: 'draft'
  });

  await createAgreementEvent({
    agreement_id: agreement.agreement_id,
    actor_id: user.user_id,
    event_type: 'agreement_created',
    title: 'Agreement draft created',
    description: 'Agreement created as draft, awaiting tenant review',
    metadata: {
      property_id: agreement.property_id,
      tenant_id: agreement.tenant_id
    }
  });

  await notificationService.createNotification({
    user_id: tenant.user_id,
    type: 'system',
    title: 'New agreement draft awaiting your review',
    message: `A draft agreement has been created for your tenancy at ${property.name}. Review and accept or reject it.`,
    metadata: {
      agreement_id: agreement.agreement_id,
      property_id: agreement.property_id
    },
    sendEmail: true
  });

  return agreement;
};

const updateAgreement = async (agreementId, payload, user) => {
  const agreement = await getAgreementById(agreementId, user);
  await agreement.update(payload);
  return agreement;
};

const revokeAgreement = async (agreementId, reason, user) => {
  const agreement = await getAgreementById(agreementId, user);
  
  // Only allow revoking if in appropriate status
  if (!['draft', 'pending_deposit', 'started', 'ended'].includes(agreement.status)) {
    throw ApiError.badRequest(`Agreement cannot be revoked from status ${agreement.status}`);
  }

  // If deposit was paid (started/ended), initiate a refund via Razorpay
  if (agreement.status === 'started' || agreement.status === 'ended') {
    const depositAmount = Number(agreement.deposit_amount || 0);
    if (depositAmount > 0) {
      try {
        const paymentService = require('../../payment/services/paymentService');
        await paymentService.refundPayment(
          agreement.agreement_id,
          depositAmount,
          `Full deposit refund on revocation: ${reason || 'Agreement revoked'}`,
          user
        );
      } catch (refundError) {
        console.error('Failed to initiate Razorpay refund during revocation:', refundError);
        // We log the error but proceed with closing the agreement
        // The owner might need to refund manually if automated refund fails
      }
    }
  }

  await agreement.update({
    status: 'closed',
    closed_at: new Date(),
    closed_reason: reason || 'Revoked by owner/admin',
    revoked_at: new Date(),
    revoke_reason: reason || 'Revoked by owner/admin'
  });

  await createAgreementEvent({
    agreement_id: agreement.agreement_id,
    actor_id: user.user_id,
    event_type: 'agreement_closed',
    title: 'Agreement closed (revoked)',
    description: reason || 'Agreement closed midway by owner/admin',
    metadata: { status: 'closed' }
  });

  await notificationService.createNotification({
    user_id: agreement.tenant_id,
    type: 'system',
    title: 'Agreement has been closed',
    message: `Agreement ${agreement.agreement_number || agreement.agreement_id} has been closed by the owner.`,
    metadata: { agreement_id: agreement.agreement_id, reason: reason || null },
    sendEmail: true
  });

  return agreement;
};

const renewAgreement = async (agreementId, payload, user) => {
  const oldAgreement = await getAgreementById(agreementId, user);

  if (!['started', 'ended'].includes(oldAgreement.status)) {
    throw ApiError.badRequest('Only started or ended agreements can be renewed');
  }

  // Mark old agreement as ended if still started
  if (oldAgreement.status === 'started') {
    await oldAgreement.update({ status: 'ended', ended_at: new Date() });
  }

  // Create a brand new agreement for the renewal
  const newAgreement = await db.Agreement.create({
    property_id: oldAgreement.property_id,
    owner_id: oldAgreement.owner_id,
    tenant_id: oldAgreement.tenant_id,
    invite_id: oldAgreement.invite_id,
    start_date: payload.start_date || oldAgreement.end_date,
    end_date: payload.end_date,
    rent_amount: payload.rent_amount || oldAgreement.rent_amount,
    deposit_amount: payload.deposit_amount ?? oldAgreement.deposit_amount,
    rent_due_day: oldAgreement.rent_due_day,
    gst_rate: oldAgreement.gst_rate,
    terms: oldAgreement.terms,
    status: 'draft',
    renewed_from: oldAgreement.agreement_id
  });

  await createAgreementEvent({
    agreement_id: oldAgreement.agreement_id,
    actor_id: user.user_id,
    event_type: 'agreement_renewed',
    title: 'Agreement renewed — new draft created',
    description: `A new renewal agreement #${newAgreement.agreement_id} was created from this agreement`,
    metadata: { new_agreement_id: newAgreement.agreement_id }
  });

  await createAgreementEvent({
    agreement_id: newAgreement.agreement_id,
    actor_id: user.user_id,
    event_type: 'agreement_created',
    title: 'Renewal agreement draft created',
    description: `Renewed from agreement #${oldAgreement.agreement_id}`,
    metadata: { renewed_from: oldAgreement.agreement_id }
  });

  await notificationService.createNotification({
    user_id: oldAgreement.tenant_id,
    type: 'system',
    title: 'Agreement renewal draft created',
    message: `A renewal agreement has been created for your tenancy. Please review and accept it.`,
    metadata: { agreement_id: newAgreement.agreement_id, renewed_from: oldAgreement.agreement_id },
    sendEmail: true
  });

  return { oldAgreement, newAgreement };
};

const acceptAgreement = async (agreementId, user) => {
  const agreement = await getAgreementById(agreementId, user);

  if (user.role !== 'tenant' || agreement.tenant_id !== user.user_id) {
    throw ApiError.forbidden('Only the assigned tenant can accept this agreement');
  }

  if (!['draft', 'rejected'].includes(agreement.status)) {
    throw ApiError.badRequest(`Agreement cannot be accepted from status ${agreement.status}`);
  }

  // Enforce profile completeness before acceptance
  const tenant = await db.User.findByPk(user.user_id);
  const profile = getProfileCompleteness(tenant);
  if (!profile.is_complete) {
    throw ApiError.badRequest(`Profile incomplete. Missing: ${profile.missing.join(', ')}. Complete your profile before accepting.`);
  }

  // Check tenant has at least one gov doc uploaded
  const docCount = await db.Document.count({ where: { user_id: user.user_id, doc_type: ['aadhaar', 'pan', 'address_proof'], deleted_at: null } });
  if (docCount === 0) {
    throw ApiError.badRequest('Upload at least one KYC document (Aadhaar/PAN/Address Proof) before accepting.');
  }

  const nextStatus = Number(agreement.deposit_amount || 0) > 0 ? 'pending_deposit' : 'started';
  const now = new Date();

  // Generate agreement number on first acceptance
  const agreementNumber = agreement.agreement_number || buildAgreementNumber(agreement);

  await agreement.update({
    status: nextStatus,
    agreement_number: agreementNumber,
    accepted_at: now,
    rejected_at: null,
    rejection_reason: null,
    started_at: nextStatus === 'started' ? now : agreement.started_at
  });

  await createAgreementEvent({
    agreement_id: agreement.agreement_id,
    actor_id: user.user_id,
    event_type: 'agreement_accepted',
    title: 'Agreement accepted by tenant',
    description: nextStatus === 'pending_deposit'
      ? 'Tenant accepted the agreement. Deposit payment is pending.'
      : 'Tenant accepted the agreement and it is now started.',
    metadata: { status: nextStatus, agreement_number: agreementNumber }
  });

  await notificationService.createNotification({
    user_id: agreement.owner_id,
    type: 'system',
    title: 'Tenant accepted the agreement',
    message: `Agreement ${agreement.agreement_number || agreement.agreement_id} was accepted by the tenant.`,
    metadata: {
      agreement_id: agreement.agreement_id,
      status: nextStatus
    },
    sendEmail: true
  });

  return agreement;
};

const rejectAgreement = async (agreementId, payload, user) => {
  const agreement = await getAgreementById(agreementId, user);

  if (user.role !== 'tenant' || agreement.tenant_id !== user.user_id) {
    throw ApiError.forbidden('Only the assigned tenant can reject this agreement');
  }

  if (!['draft', 'pending_deposit'].includes(agreement.status)) {
    throw ApiError.badRequest(`Agreement cannot be rejected from status ${agreement.status}`);
  }

  await agreement.update({
    status: 'rejected',
    rejected_at: new Date(),
    rejection_reason: payload?.reason || null
  });

  await createAgreementEvent({
    agreement_id: agreement.agreement_id,
    actor_id: user.user_id,
    event_type: 'agreement_rejected',
    title: 'Agreement rejected by tenant',
    description: payload?.reason || 'Agreement rejected by tenant',
    metadata: { reason: payload?.reason || null }
  });

  await notificationService.createNotification({
    user_id: agreement.owner_id,
    type: 'system',
    title: 'Tenant rejected the agreement',
    message: `Agreement ${agreement.agreement_number || agreement.agreement_id} was rejected by the tenant.`,
    metadata: {
      agreement_id: agreement.agreement_id,
      reason: payload?.reason || null
    },
    sendEmail: true
  });

  return agreement;
};

const settleAgreement = async (agreementId, payload, user) => {
  const agreement = await getAgreementById(agreementId, user);

  if (!['started', 'ended', 'pending_deposit'].includes(agreement.status)) {
    throw ApiError.badRequest(`Agreement cannot be settled from status ${agreement.status}`);
  }

  const depositAmount = Number(agreement.deposit_amount || 0);
  const refundAmount = Number(payload.refund_amount || 0);
  const deductionAmount = Number(payload.deduction_amount || 0);

  if (refundAmount + deductionAmount !== depositAmount) {
    throw ApiError.badRequest('Refund amount plus deduction amount must equal the total deposit amount');
  }

  let refundTransaction = null;
  if (refundAmount > 0) {
    try {
      const paymentService = require('../../payment/services/paymentService');
      refundTransaction = await paymentService.refundPayment(
        agreement.agreement_id,
        refundAmount,
        payload.deduction_reason || payload.closed_reason || 'Agreement settled',
        user
      );
    } catch (refundError) {
      console.error('Failed to initiate Razorpay refund during settlement:', refundError);
      // Fallback: create a record of the intended refund even if gateway call failed
      refundTransaction = await db.Transaction.create({
        agreement_id: agreement.agreement_id,
        paid_by: agreement.owner_id,
        type: 'refund',
        amount: refundAmount,
        gst_amount: 0,
        status: 'pending', // Mark as pending since automated call failed
        description: `ASYNC REFUND REQUIRED: ${payload.deduction_reason || 'Settlement'}`
      });
    }
  }

  await agreement.update({
    status: 'closed',
    closed_at: new Date(),
    closed_reason: payload.deduction_reason || payload.closed_reason || 'Agreement settled and closed'
  });

  await createAgreementEvent({
    agreement_id: agreement.agreement_id,
    actor_id: user.user_id,
    event_type: 'agreement_settled',
    title: 'Agreement settled and closed',
    description: `Refund: ${refundAmount}, Deduction: ${deductionAmount}`,
    metadata: {
      refund_amount: refundAmount,
      deduction_amount: deductionAmount,
      deduction_reason: payload.deduction_reason || null,
      refund_transaction_id: refundTransaction?.transaction_id || null
    }
  });

  await notificationService.createNotification({
    user_id: agreement.tenant_id,
    type: 'payment',
    title: 'Deposit settlement processed',
    message: `Your agreement ${agreement.agreement_number || agreement.agreement_id} has been settled. Refund: ${refundAmount}, Deduction: ${deductionAmount}.`,
    metadata: {
      agreement_id: agreement.agreement_id,
      refund_amount: refundAmount,
      deduction_amount: deductionAmount
    },
    sendEmail: true
  });

  return {
    agreement,
    refundTransaction,
    refund_amount: refundAmount,
    deduction_amount: deductionAmount
  };
};

const getAgreementTimeline = async (agreementId, user) => {
  const agreement = await getAgreementById(agreementId, user);

  const events = await db.AgreementEvent.findAll({
    where: { agreement_id: agreement.agreement_id },
    include: [{ model: db.User, as: 'actor', attributes: ['user_id', 'full_name', 'email', 'role'], required: false }],
    order: [['created_at', 'ASC']]
  });

  return {
    agreement_id: agreement.agreement_id,
    agreement_number: agreement.agreement_number,
    status: agreement.status,
    events
  };
};

const generateAgreementPdfFile = async (agreementId, user) => {
  const agreement = await getAgreementById(agreementId, user);
  const pdf = await generateAgreementPdf(agreement);
  await agreement.update({ pdf_url: `/uploads/${pdf.relativePath}` });

  return {
    filePath: pdf.filePath,
    fileName: pdf.fileName,
    pdfUrl: `/uploads/${pdf.relativePath}`
  };
};

const getPendingActions = async (user) => {
  const actor = await db.User.findByPk(user.user_id);
  if (!actor) {
    throw ApiError.notFound('User not found');
  }

  const profile = getProfileCompleteness(actor);
  const response = {
    profile,
    agreements: {
      drafts: [],
      pendingDeposits: []
    },
    transactions: {
      pendingRent: []
    },
    flags: {
      needsProfileCompletion: !profile.is_complete,
      needsAgreementReview: false,
      needsDepositPayment: false,
      hasPendingRent: false
    }
  };

  if (actor.role === 'tenant') {
    response.agreements.drafts = await db.Agreement.findAll({
      where: { tenant_id: actor.user_id, status: 'draft' },
      include: [
        { model: db.Property, as: 'property' },
        { model: db.User, as: 'owner', attributes: ['user_id', 'full_name', 'email', 'profile_photo', 'role'] }
      ],
      order: [['updated_at', 'DESC']]
    });

    response.agreements.pendingDeposits = await db.Agreement.findAll({
      where: { tenant_id: actor.user_id, status: 'pending_deposit' },
      include: [
        { model: db.Property, as: 'property' },
        { model: db.User, as: 'owner', attributes: ['user_id', 'full_name', 'email', 'profile_photo', 'role'] }
      ],
      order: [['updated_at', 'DESC']]
    });

    response.transactions.pendingRent = await db.Transaction.findAll({
      where: {
        paid_by: actor.user_id,
        type: 'rent',
        status: 'pending'
      },
      include: [
        {
          model: db.Agreement,
          as: 'agreement',
          include: [{ model: db.Property, as: 'property' }]
        }
      ],
      order: [['created_at', 'DESC']]
    });
  }

  response.flags.needsAgreementReview = response.agreements.drafts.length > 0;
  response.flags.needsDepositPayment = response.agreements.pendingDeposits.length > 0;
  response.flags.hasPendingRent = response.transactions.pendingRent.length > 0;

  return response;
};

module.exports = {
  listAgreements,
  getAgreementById,
  createAgreement,
  updateAgreement,
  revokeAgreement,
  renewAgreement,
  acceptAgreement,
  rejectAgreement,
  settleAgreement,
  getAgreementTimeline,
  generateAgreementPdfFile,
  getProfileCompleteness,
  getPendingActions
};
