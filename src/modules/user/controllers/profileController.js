const profileService = require('../services/profileService');
const ApiResponse = require('../../../utils/ApiResponse');

const getMyProfile = async (req, res, next) => {
  try {
    const profile = await profileService.getMyProfile(req.user.user_id);
    return ApiResponse.success(res, profile);
  } catch (error) {
    next(error);
  }
};

const updateMyProfile = async (req, res, next) => {
  try {
    const profile = await profileService.updateMyProfile(req.user.user_id, req.body);
    return ApiResponse.success(res, profile, 'Profile updated successfully');
  } catch (error) {
    next(error);
  }
};

const uploadProfilePhoto = async (req, res, next) => {
  try {
    const profile = await profileService.uploadProfilePhoto(req.user.user_id, req.file);
    return ApiResponse.success(res, profile, 'Profile photo uploaded successfully');
  } catch (error) {
    next(error);
  }
};

const uploadDocument = async (req, res, next) => {
  try {
    const document = await profileService.uploadDocument(req.user.user_id, req.body, req.file);
    return ApiResponse.created(res, document, 'Document uploaded successfully');
  } catch (error) {
    next(error);
  }
};

const listMyDocuments = async (req, res, next) => {
  try {
    const documents = await profileService.listMyDocuments(req.user.user_id);
    return ApiResponse.success(res, documents);
  } catch (error) {
    next(error);
  }
};

const getProfileCompleteness = async (req, res, next) => {
  try {
    const result = await profileService.getProfileCompleteness(req.user.user_id);
    return ApiResponse.success(res, result);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMyProfile,
  updateMyProfile,
  uploadProfilePhoto,
  uploadDocument,
  listMyDocuments,
  getProfileCompleteness
};
