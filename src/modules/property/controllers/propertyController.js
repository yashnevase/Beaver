const propertyService = require('../services/propertyService');
const ApiResponse = require('../../../utils/ApiResponse');

const listProperties = async (req, res, next) => {
  try {
    const result = await propertyService.listProperties(req.query, req.user);
    return ApiResponse.success(res, result, 'Properties fetched successfully');
  } catch (error) {
    next(error);
  }
};

const createProperty = async (req, res, next) => {
  try {
    const result = await propertyService.createProperty(req.body, req.user);
    return ApiResponse.created(res, result, 'Property created successfully');
  } catch (error) {
    next(error);
  }
};

const getPropertyById = async (req, res, next) => {
  try {
    const result = await propertyService.getPropertyById(req.params.id, req.user);
    return ApiResponse.success(res, result, 'Property fetched successfully');
  } catch (error) {
    next(error);
  }
};

const updateProperty = async (req, res, next) => {
  try {
    const result = await propertyService.updateProperty(req.params.id, req.body, req.user);
    return ApiResponse.success(res, result, 'Property updated successfully');
  } catch (error) {
    next(error);
  }
};

const deleteProperty = async (req, res, next) => {
  try {
    const result = await propertyService.deleteProperty(req.params.id, req.user);
    return ApiResponse.success(res, result, result.message);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listProperties,
  createProperty,
  getPropertyById,
  updateProperty,
  deleteProperty
};
