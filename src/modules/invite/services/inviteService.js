const jwt = require('jsonwebtoken');
const db = require('../../../models');
const emailService = require('../../../lib/email');
const { ApiError } = require('../../../middleware/errorHandler');
const logger = require('../../../config/logger');

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

const buildInviteToken = ({ propertyId, email, invitedBy }) => {
  return jwt.sign(
    {
      property_id: propertyId,
      email,
      invited_by: invitedBy,
      type: 'tenant-invite'
    },
    process.env.INVITE_TOKEN_SECRET || process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

const verifyInviteToken = (token) => {
  try {
    return jwt.verify(token, process.env.INVITE_TOKEN_SECRET || process.env.JWT_SECRET);
  } catch (error) {
    return null;
  }
};

const createInvite = async ({ property_id, email }, user) => {
  const property = await db.Property.findByPk(property_id);

  if (!property) {
    throw ApiError.notFound('Property not found');
  }

  if (user.role === 'owner' && property.owner_id !== user.user_id) {
    throw ApiError.forbidden('You can only invite tenants to your own properties');
  }

  const token = buildInviteToken({
    propertyId: property.property_id,
    email,
    invitedBy: user.user_id
  });

  const invite = await db.Invite.create({
    token,
    property_id: property.property_id,
    email,
    invited_by: user.user_id,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  const inviteUrl = `${process.env.FRONTEND_URL || process.env.BASE_URL}/invite/${token}`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      <h2>You have been invited to join Beaver</h2>
      <p>You have been invited as a tenant for property <strong>${property.name}</strong>.</p>
      <p>Click the link below to complete your registration:</p>
      <p><a href="${inviteUrl}">${inviteUrl}</a></p>
      <p>This invite expires in 7 days.</p>
    </div>
  `;

  try {
    await emailService.sendEmail(email, 'Beaver Tenant Invite', html);
  } catch (error) {
    logger.error(`Failed to send invite email to ${email}:`, error);
  }

  return {
    invite,
    inviteUrl
  };
};

const getInviteByToken = async (token) => {
  const payload = verifyInviteToken(token);
  if (!payload) {
    throw ApiError.badRequest('Invalid or expired invite token');
  }

  const invite = await db.Invite.findOne({
    where: { token },
    include: [{ model: db.Property, as: 'property' }]
  });

  if (!invite) {
    throw ApiError.notFound('Invite not found');
  }

  if (invite.status !== 'pending') {
    throw ApiError.badRequest(`Invite is ${invite.status}`);
  }

  if (new Date(invite.expires_at) < new Date()) {
    await invite.update({ status: 'expired' });
    throw ApiError.badRequest('Invite has expired');
  }

  return {
    invite,
    prefill: {
      email: invite.email,
      property_id: invite.property_id,
      property_name: invite.property?.name
    }
  };
};

const acceptInvite = async (token, user) => {
  const payload = verifyInviteToken(token);
  if (!payload) {
    throw ApiError.badRequest('Invalid or expired invite token');
  }

  const invite = await db.Invite.findOne({
    where: { token },
    include: [{ model: db.Property, as: 'property' }]
  });
  if (!invite) {
    throw ApiError.notFound('Invite not found');
  }

  if (invite.status !== 'pending') {
    throw ApiError.badRequest(`Invite is ${invite.status}`);
  }

  if (invite.email !== user.email) {
    throw ApiError.forbidden('Invite email does not match authenticated user');
  }

  await invite.update({
    status: 'used',
    used_by: user.user_id
  });

  let agreement = await db.Agreement.findOne({
    where: {
      invite_id: invite.invite_id
    }
  });

  if (!agreement) {
    agreement = await db.Agreement.create({
      property_id: invite.property_id,
      owner_id: invite.invited_by,
      tenant_id: user.user_id,
      invite_id: invite.invite_id,
      start_date: new Date().toISOString().slice(0, 10),
      end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
      rent_amount: invite.property?.rent_amount || 0,
      deposit_amount: invite.property?.deposit_amount || 0,
      rent_due_day: 1,
      gst_rate: Number(process.env.DEFAULT_GST_RATE || 0),
      terms: {
        source: 'invite_acceptance',
        note: 'Draft generated after tenant onboarding via invite'
      },
      status: 'draft'
    });

    await db.AgreementEvent.create({
      agreement_id: agreement.agreement_id,
      actor_id: user.user_id,
      event_type: 'invite_accepted',
      title: 'Invite accepted and draft agreement created',
      description: 'Tenant accepted the invite. A draft agreement was auto-created.',
      metadata: {
        invite_id: invite.invite_id,
        property_id: invite.property_id
      }
    });
  }

  return {
    message: 'Invite accepted successfully',
    property_id: invite.property_id,
    agreement_id: agreement.agreement_id,
    agreement_number: agreement.agreement_number,
    next_step: 'Complete profile/KYC, review agreement, then accept or reject it'
  };
};

module.exports = {
  createInvite,
  getInviteByToken,
  acceptInvite,
  verifyInviteToken
};
