const db = require('../../../models');
const { ApiError } = require('../../../middleware/errorHandler');
const { getFileUrl } = require('../../../utils/fileUpload');
const ApiResponse = require('../../../utils/ApiResponse');

const uploadAgreementDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const agreement = await db.Agreement.findByPk(id);

    if (!agreement) {
      throw ApiError.notFound('Agreement not found');
    }

    if (req.user.role === 'owner' && agreement.owner_id !== req.user.user_id) {
      throw ApiError.forbidden('You can only upload documents for your own agreements');
    }

    if (!req.file) {
      throw ApiError.badRequest('Document file is required');
    }

    const fileUrl = getFileUrl(req.file.path);

    const doc = await db.AgreementDocument.create({
      agreement_id: agreement.agreement_id,
      uploaded_by: req.user.user_id,
      doc_type: req.body.doc_type || 'certificate',
      title: req.body.title || null,
      file_url: fileUrl
    });

    // If certificate_number provided, update agreement
    if (req.body.certificate_number) {
      await agreement.update({ certificate_number: req.body.certificate_number });
    }

    return ApiResponse.created(res, doc, 'Agreement document uploaded successfully');
  } catch (error) {
    next(error);
  }
};

const listAgreementDocuments = async (req, res, next) => {
  try {
    const { id } = req.params;
    const agreement = await db.Agreement.findByPk(id);

    if (!agreement) {
      throw ApiError.notFound('Agreement not found');
    }

    if (req.user.role === 'owner' && agreement.owner_id !== req.user.user_id) {
      throw ApiError.forbidden('Access denied');
    }
    if (req.user.role === 'tenant' && agreement.tenant_id !== req.user.user_id) {
      throw ApiError.forbidden('Access denied');
    }

    const docs = await db.AgreementDocument.findAll({
      where: { agreement_id: agreement.agreement_id },
      include: [{ model: db.User, as: 'uploader', attributes: ['user_id', 'full_name', 'role'] }],
      order: [['created_at', 'DESC']]
    });

    return ApiResponse.success(res, docs);
  } catch (error) {
    next(error);
  }
};

const deleteAgreementDocument = async (req, res, next) => {
  try {
    const { id, docId } = req.params;
    const doc = await db.AgreementDocument.findOne({
      where: { document_id: docId, agreement_id: id }
    });

    if (!doc) {
      throw ApiError.notFound('Document not found');
    }

    const agreement = await db.Agreement.findByPk(id);
    if (req.user.role === 'owner' && agreement.owner_id !== req.user.user_id) {
      throw ApiError.forbidden('You can only delete documents for your own agreements');
    }

    await doc.destroy();
    return ApiResponse.success(res, null, 'Document deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadAgreementDocument,
  listAgreementDocuments,
  deleteAgreementDocument
};
