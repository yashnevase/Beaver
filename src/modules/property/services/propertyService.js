const db = require('../../../models');
const cache = require('../../../utils/cache');
const { ApiError } = require('../../../middleware/errorHandler');
const { getPaginationParams, getSortParams } = require('../../../utils/pagination');

const PROPERTY_CACHE_TTL = 300;

const assertOwnerPropertyLimit = async (user) => {
  if (user.role !== 'owner' || user.tier !== 'free') {
    return;
  }

  const propertyCount = await db.Property.count({
    where: {
      owner_id: user.user_id,
      is_active: true
    }
  });

  if (propertyCount >= 1) {
    throw ApiError.forbidden('Free tier allows only 1 active property');
  }
};

const createProperty = async (payload, user) => {
  await assertOwnerPropertyLimit(user);

  const property = await db.Property.create({
    ...payload,
    owner_id: user.user_id,
    photos: payload.photos || []
  });

  await cache.delByPrefix(`owner-properties:${user.user_id}`);
  return property;
};

const listProperties = async (query, user) => {
  const cacheKey = `owner-properties:${user.user_id}:${JSON.stringify(query)}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const { page, limit, offset } = getPaginationParams(query);
  const { sort, order } = getSortParams(query, ['created_at', 'updated_at', 'city', 'rent_amount', 'name']);

  const where = {};
  if (user.role === 'owner') {
    where.owner_id = user.user_id;
  }
  if (query.type) {
    where.type = query.type;
  }
  if (query.city) {
    where.city = query.city;
  }
  if (query.is_active !== undefined) {
    where.is_active = query.is_active === 'true';
  }

  const result = await db.Property.findAndCountAll({
    where,
    order: [[sort, order]],
    offset,
    limit,
    include: [{ model: db.PropertyImage, as: 'images', limit: 1 }]
  });

  const response = {
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

  await cache.set(cacheKey, response, PROPERTY_CACHE_TTL);
  return response;
};

const getPropertyById = async (propertyId, user) => {
  const property = await db.Property.findByPk(propertyId, {
    include: [
      { model: db.User, as: 'owner', attributes: ['user_id', 'full_name', 'email', 'phone'] },
      { model: db.PropertyImage, as: 'images' },
      {
        model: db.Agreement,
        as: 'agreements',
        include: [
          { model: db.User, as: 'tenant', attributes: ['user_id', 'full_name', 'email', 'phone', 'profile_photo'] }
        ],
        order: [['created_at', 'DESC']]
      }
    ]
  });

  if (!property) {
    throw ApiError.notFound('Property not found');
  }

  if (user.role === 'owner' && property.owner_id !== user.user_id) {
    throw ApiError.forbidden('You can only access your own properties');
  }

  return property;
};

const updateProperty = async (propertyId, payload, user) => {
  const property = await getPropertyById(propertyId, user);

  await property.update(payload);
  await cache.delByPrefix(`owner-properties:${user.user_id}`);
  return property;
};

const deleteProperty = async (propertyId, user) => {
  const property = await getPropertyById(propertyId, user);
  await property.update({ is_active: false });
  await cache.delByPrefix(`owner-properties:${user.user_id}`);
  return { message: 'Property archived successfully' };
};

module.exports = {
  createProperty,
  listProperties,
  getPropertyById,
  updateProperty,
  deleteProperty,
  assertOwnerPropertyLimit
};
