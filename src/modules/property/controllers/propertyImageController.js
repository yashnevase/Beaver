const db = require('../../../models');
const { ApiError } = require('../../../middleware/errorHandler');
const { getFileUrl } = require('../../../utils/fileUpload');
const ApiResponse = require('../../../utils/ApiResponse');

const addPropertyImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const property = await db.Property.findByPk(id);

    if (!property) {
      throw ApiError.notFound('Property not found');
    }

    if (req.user.role === 'owner' && property.owner_id !== req.user.user_id) {
      throw ApiError.forbidden('You can only manage images for your own properties');
    }

    if (!req.file) {
      throw ApiError.badRequest('Image file is required');
    }

    const fileUrl = getFileUrl(req.file.path);
    const maxSort = await db.PropertyImage.max('sort_order', { where: { property_id: id } }) || 0;

    const image = await db.PropertyImage.create({
      property_id: property.property_id,
      file_url: fileUrl,
      caption: req.body.caption || null,
      sort_order: maxSort + 1
    });

    return ApiResponse.created(res, image, 'Property image added successfully');
  } catch (error) {
    next(error);
  }
};

const listPropertyImages = async (req, res, next) => {
  try {
    const { id } = req.params;
    const images = await db.PropertyImage.findAll({
      where: { property_id: id },
      order: [['sort_order', 'ASC']]
    });

    return ApiResponse.success(res, images);
  } catch (error) {
    next(error);
  }
};

const deletePropertyImage = async (req, res, next) => {
  try {
    const { id, imageId } = req.params;
    const property = await db.Property.findByPk(id);

    if (!property) {
      throw ApiError.notFound('Property not found');
    }

    if (req.user.role === 'owner' && property.owner_id !== req.user.user_id) {
      throw ApiError.forbidden('You can only manage images for your own properties');
    }

    const image = await db.PropertyImage.findOne({
      where: { image_id: imageId, property_id: id }
    });

    if (!image) {
      throw ApiError.notFound('Image not found');
    }

    await image.destroy();
    return ApiResponse.success(res, null, 'Property image deleted successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  addPropertyImage,
  listPropertyImages,
  deletePropertyImage
};
