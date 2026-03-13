const db = require('../../../models');
const cache = require('../../../utils/cache');

const DASHBOARD_CACHE_TTL = 300;

const getDashboard = async (user) => {
  const cacheKey = `dashboard:${user.user_id}:${user.role}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  let result;

  if (user.role === 'owner') {
    const properties = await db.Property.findAll({ where: { owner_id: user.user_id } });
    const agreements = await db.Agreement.findAll({ where: { owner_id: user.user_id } });
    const transactions = await db.Transaction.findAll({
      include: [{ model: db.Agreement, as: 'agreement', where: { owner_id: user.user_id } }],
      order: [['created_at', 'DESC']],
      limit: 10
    });

    result = {
      summary: {
        propertyCount: properties.length,
        activeAgreements: agreements.filter(a => a.status === 'active').length,
        expiredAgreements: agreements.filter(a => a.status === 'expired').length,
        totalMonthlyRent: agreements.filter(a => a.status === 'active').reduce((sum, a) => sum + Number(a.rent_amount), 0)
      },
      properties,
      recentTransactions: transactions
    };
  } else {
    const agreement = await db.Agreement.findOne({
      where: { tenant_id: user.user_id, status: 'active' },
      include: [{ model: db.Property, as: 'property' }]
    });

    const transactions = await db.Transaction.findAll({
      where: { paid_by: user.user_id },
      order: [['created_at', 'DESC']],
      limit: 10
    });

    result = {
      agreement,
      property: agreement?.property || null,
      recentTransactions: transactions,
      dueTransactions: transactions.filter(t => t.status === 'pending')
    };
  }

  await cache.set(cacheKey, result, DASHBOARD_CACHE_TTL);
  return result;
};

const getAnalytics = async (user) => {
  if (user.role !== 'owner' && user.role !== 'admin') {
    return {
      occupancyRate: 0,
      collectionRate: 0,
      monthlyRevenue: 0
    };
  }

  const agreements = await db.Agreement.findAll({ where: { owner_id: user.user_id } });
  const transactions = await db.Transaction.findAll({
    include: [{ model: db.Agreement, as: 'agreement', where: { owner_id: user.user_id } }]
  });

  const totalAgreements = agreements.length || 1;
  const activeAgreements = agreements.filter(a => a.status === 'active').length;
  const completedTransactions = transactions.filter(t => t.status === 'completed');
  const pendingTransactions = transactions.filter(t => t.status === 'pending');

  return {
    occupancyRate: Number(((activeAgreements / totalAgreements) * 100).toFixed(2)),
    collectionRate: Number(((completedTransactions.length / (completedTransactions.length + pendingTransactions.length || 1)) * 100).toFixed(2)),
    monthlyRevenue: completedTransactions.reduce((sum, t) => sum + Number(t.amount), 0)
  };
};

module.exports = {
  getDashboard,
  getAnalytics
};
