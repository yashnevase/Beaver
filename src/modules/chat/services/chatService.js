const db = require('../../../models');
const { emitToRoom } = require('../../../config/socket');
const { ApiError } = require('../../../middleware/errorHandler');
const { getPaginationParams } = require('../../../utils/pagination');

const assertAgreementAccess = async (agreementId, user) => {
  const agreement = await db.Agreement.findByPk(agreementId);
  if (!agreement) {
    throw ApiError.notFound('Agreement not found');
  }

  const hasAccess = user.role === 'admin'
    || agreement.owner_id === user.user_id
    || agreement.tenant_id === user.user_id;

  if (!hasAccess) {
    throw ApiError.forbidden('You do not have access to this chat');
  }

  return agreement;
};

const listMessages = async (agreementId, user, query) => {
  await assertAgreementAccess(agreementId, user);
  const { page, limit, offset } = getPaginationParams(query);

  const result = await db.Chat.findAndCountAll({
    where: { agreement_id: agreementId },
    include: [{ model: db.User, as: 'sender', attributes: ['user_id', 'full_name', 'role'] }],
    order: [['created_at', 'DESC']],
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

const sendMessage = async (agreementId, payload, user) => {
  await assertAgreementAccess(agreementId, user);

  if (!payload.message && !payload.image_url) {
    throw ApiError.badRequest('Message or image is required');
  }

  const message = await db.Chat.create({
    agreement_id: agreementId,
    sender_id: user.user_id,
    message: payload.message || null,
    image_url: payload.image_url || null
  });

  const fullMessage = await db.Chat.findByPk(message.chat_id, {
    include: [{ model: db.User, as: 'sender', attributes: ['user_id', 'full_name', 'role'] }]
  });

  emitToRoom(`agreement:${agreementId}`, 'chat:new-message', fullMessage);
  return fullMessage;
};

module.exports = {
  listMessages,
  sendMessage,
  assertAgreementAccess
};
