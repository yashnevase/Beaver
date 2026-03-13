const transactionService = require('../services/transactionService');
const ApiResponse = require('../../../utils/ApiResponse');

const listTransactions = async (req, res, next) => {
  try {
    const result = await transactionService.listTransactions(req.query, req.user);
    return ApiResponse.success(res, result, 'Transactions fetched successfully');
  } catch (error) {
    next(error);
  }
};

const getTransactionById = async (req, res, next) => {
  try {
    const result = await transactionService.getTransactionById(req.params.id, req.user);
    return ApiResponse.success(res, result, 'Transaction fetched successfully');
  } catch (error) {
    next(error);
  }
};

const exportTransactionsPdf = async (req, res, next) => {
  try {
    const result = await transactionService.exportTransactionsPdf(req.user);
    return res.download(result.filePath, result.fileName);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listTransactions,
  getTransactionById,
  exportTransactionsPdf
};
