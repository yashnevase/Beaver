const db = require('../../../models');
const { ApiError } = require('../../../middleware/errorHandler');
const { getPaginationParams, getSortParams } = require('../../../utils/pagination');
const { generateTransactionsPdf } = require('./transactionPdfService');

const listTransactions = async (query, user) => {
  const { page, limit, offset } = getPaginationParams(query);
  const { sort, order } = getSortParams(query, ['created_at', 'due_date', 'paid_at', 'amount', 'status', 'type']);

  const where = {};
  const agreementWhere = {};

  if (user.role === 'tenant') {
    agreementWhere.tenant_id = user.user_id;
  }

  if (user.role === 'owner') {
    agreementWhere.owner_id = user.user_id;
  }

  if (query.status) {
    where.status = query.status;
  }
  if (query.type) {
    where.type = query.type;
  }

  const result = await db.Transaction.findAndCountAll({
    where,
    include: [{
      model: db.Agreement,
      as: 'agreement',
      where: Object.keys(agreementWhere).length > 0 ? agreementWhere : undefined,
      include: [{ model: db.Property, as: 'property' }]
    }],
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

const getTransactionById = async (transactionId, user) => {
  const transaction = await db.Transaction.findByPk(transactionId, {
    include: [{
      model: db.Agreement,
      as: 'agreement',
      include: [{ model: db.Property, as: 'property' }]
    }]
  });

  if (!transaction) {
    throw ApiError.notFound('Transaction not found');
  }

  const agreement = transaction.agreement;
  const hasAccess = user.role === 'admin'
    || transaction.paid_by === user.user_id
    || agreement?.owner_id === user.user_id
    || agreement?.tenant_id === user.user_id;

  if (!hasAccess) {
    throw ApiError.forbidden('You do not have access to this transaction');
  }

  return transaction;
};

const exportTransactionsPdf = async (user) => {
  const query = user.role === 'tenant'
    ? { paid_by: user.user_id }
    : undefined;

  const include = [{
    model: db.Agreement,
    as: 'agreement',
    include: [{ model: db.Property, as: 'property' }],
    where: user.role === 'tenant' 
      ? { tenant_id: user.user_id }
      : (user.role === 'owner' ? { owner_id: user.user_id } : undefined)
  }];

  const transactions = await db.Transaction.findAll({
    where: query,
    include,
    order: [['created_at', 'DESC']]
  });

  const pdf = await generateTransactionsPdf(transactions, user);

  return {
    filePath: pdf.filePath,
    fileName: pdf.fileName,
    pdfUrl: `/uploads/${pdf.relativePath}`
  };
};

module.exports = {
  listTransactions,
  getTransactionById,
  exportTransactionsPdf
};
