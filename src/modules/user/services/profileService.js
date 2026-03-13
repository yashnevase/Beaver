const { Op } = require('sequelize');
const db = require('../../../models');
const { ApiError } = require('../../../middleware/errorHandler');
const { getFileUrl } = require('../../../utils/fileUpload');

const getMyProfile = async (userId) => {
  const user = await db.User.findOne({
    where: {
      user_id: userId,
      deleted_at: null
    },
    include: [{
      model: db.Document,
      as: 'documents',
      where: { deleted_at: null },
      required: false,
      order: [['created_at', 'DESC']]
    }]
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return user;
};

const updateMyProfile = async (userId, payload) => {
  const user = await db.User.findOne({
    where: {
      user_id: userId,
      deleted_at: null
    }
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const allowedFields = [
    'full_name',
    'phone',
    'address_line',
    'city',
    'state',
    'pincode',
    'bank_account_number',
    'bank_ifsc',
    'bank_name',
    'date_of_birth',
    'gender'
  ];

  const updates = {};
  allowedFields.forEach((field) => {
    if (payload[field] !== undefined) {
      updates[field] = payload[field];
    }
  });

  await user.update(updates);
  return getMyProfile(userId);
};

const uploadProfilePhoto = async (userId, file) => {
  if (!file) {
    throw ApiError.badRequest('Profile photo file is required');
  }

  const user = await db.User.findOne({
    where: {
      user_id: userId,
      deleted_at: null
    }
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const fileUrl = getFileUrl(file.path);
  await user.update({ profile_photo: fileUrl });

  await db.Document.create({
    user_id: userId,
    doc_type: 'photo',
    file_url: fileUrl,
    doc_number: null,
    verified: false
  });

  return getMyProfile(userId);
};

const uploadDocument = async (userId, payload, file) => {
  if (!file) {
    throw ApiError.badRequest('Document file is required');
  }

  const user = await db.User.findOne({
    where: {
      user_id: userId,
      deleted_at: null
    }
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  const fileUrl = getFileUrl(file.path);

  const document = await db.Document.create({
    user_id: userId,
    doc_type: payload.doc_type,
    doc_number: payload.doc_number || null,
    file_url: fileUrl,
    verified: false
  });

  return document;
};

const listMyDocuments = async (userId) => {
  const user = await db.User.findOne({
    where: {
      user_id: userId,
      deleted_at: null
    }
  });

  if (!user) {
    throw ApiError.notFound('User not found');
  }

  return db.Document.findAll({
    where: {
      user_id: userId,
      deleted_at: null
    },
    order: [['created_at', 'DESC']]
  });
};

const getProfileCompleteness = async (userId) => {
  const user = await db.User.findByPk(userId);
  if (!user) {
    throw ApiError.notFound('User not found');
  }

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
    profile_photo: !!user.profile_photo
  };

  const docCount = await db.Document.count({
    where: {
      user_id: userId,
      deleted_at: null,
      doc_type: { [Op.in]: ['aadhaar', 'pan', 'address_proof'] }
    }
  });

  const completed = Object.values(fields).filter(Boolean).length;
  const total = Object.keys(fields).length;

  return {
    is_complete: completed === total && docCount > 0,
    has_kyc_docs: docCount > 0,
    kyc_doc_count: docCount,
    profile: {
      completed,
      total,
      missing: Object.entries(fields).filter(([, v]) => !v).map(([k]) => k),
      fields
    }
  };
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadProfilePhoto,
  uploadDocument,
  listMyDocuments,
  getProfileCompleteness
};
