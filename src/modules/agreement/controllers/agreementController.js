const agreementService = require('../services/agreementService');
const ApiResponse = require('../../../utils/ApiResponse');

const getPendingActions = async (req, res, next) => {
  try {
    const result = await agreementService.getPendingActions(req.user);
    return ApiResponse.success(res, result, 'Pending actions fetched successfully');
  } catch (error) {
    next(error);
  }
};

const listAgreements = async (req, res, next) => {
  try {
    const result = await agreementService.listAgreements(req.query, req.user);
    return ApiResponse.success(res, result, 'Agreements fetched successfully');
  } catch (error) {
    next(error);
  }
};

const createAgreement = async (req, res, next) => {
  try {
    const result = await agreementService.createAgreement(req.body, req.user);
    return ApiResponse.created(res, result, 'Agreement created successfully');
  } catch (error) {
    next(error);
  }
};

const getAgreementById = async (req, res, next) => {
  try {
    const result = await agreementService.getAgreementById(req.params.id, req.user);
    return ApiResponse.success(res, result, 'Agreement fetched successfully');
  } catch (error) {
    next(error);
  }
};

const updateAgreement = async (req, res, next) => {
  try {
    const result = await agreementService.updateAgreement(req.params.id, req.body, req.user);
    return ApiResponse.success(res, result, 'Agreement updated successfully');
  } catch (error) {
    next(error);
  }
};

const revokeAgreement = async (req, res, next) => {
  try {
    const result = await agreementService.revokeAgreement(req.params.id, req.body.reason, req.user);
    return ApiResponse.success(res, result, 'Agreement revoked successfully');
  } catch (error) {
    next(error);
  }
};

const renewAgreement = async (req, res, next) => {
  try {
    const result = await agreementService.renewAgreement(req.params.id, req.body, req.user);
    return ApiResponse.success(res, result, 'Agreement renewed successfully');
  } catch (error) {
    next(error);
  }
};

const acceptAgreement = async (req, res, next) => {
  try {
    const result = await agreementService.acceptAgreement(req.params.id, req.user);
    return ApiResponse.success(res, result, 'Agreement accepted successfully');
  } catch (error) {
    next(error);
  }
};

const rejectAgreement = async (req, res, next) => {
  try {
    const result = await agreementService.rejectAgreement(req.params.id, req.body, req.user);
    return ApiResponse.success(res, result, 'Agreement rejected successfully');
  } catch (error) {
    next(error);
  }
};

const settleAgreement = async (req, res, next) => {
  try {
    const result = await agreementService.settleAgreement(req.params.id, req.body, req.user);
    return ApiResponse.success(res, result, 'Agreement settled successfully');
  } catch (error) {
    next(error);
  }
};

const getAgreementTimeline = async (req, res, next) => {
  try {
    const result = await agreementService.getAgreementTimeline(req.params.id, req.user);
    return ApiResponse.success(res, result, 'Agreement timeline fetched successfully');
  } catch (error) {
    next(error);
  }
};

const getAgreementPdf = async (req, res, next) => {
  try {
    const result = await agreementService.generateAgreementPdfFile(req.params.id, req.user);
    return res.download(result.filePath, result.fileName);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPendingActions,
  listAgreements,
  createAgreement,
  getAgreementById,
  updateAgreement,
  revokeAgreement,
  renewAgreement,
  acceptAgreement,
  rejectAgreement,
  settleAgreement,
  getAgreementTimeline,
  getAgreementPdf
};
