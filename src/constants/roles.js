const { PERMISSIONS } = require('./permissions');

const ROLES = {
  owner: {
    name: 'Owner',
    description: 'Property owner - can manage properties, agreements, invites, view payments',
    permissions: [
      'properties.create', 'properties.view', 'properties.update', 'properties.delete',
      'agreements.create', 'agreements.view', 'agreements.update', 'agreements.revoke',
      'invites.create', 'invites.view',
      'payments.view',
      'transactions.view', 'transactions.export',
      'chat.send', 'chat.view',
      'notifications.view',
      'dashboard.view', 'dashboard.analytics'
    ]
  },

  tenant: {
    name: 'Tenant',
    description: 'Tenant - can view property, pay rent, chat with owner',
    permissions: [
      'properties.view',
      'agreements.view',
      'payments.initiate', 'payments.view',
      'transactions.view',
      'chat.send', 'chat.view',
      'notifications.view',
      'dashboard.view'
    ]
  },

  admin: {
    name: 'Admin',
    description: 'Platform admin - full access',
    permissions: Object.keys(PERMISSIONS)
  }
};

const getRolePermissions = (roleName) => {
  const role = ROLES[roleName];
  return role ? role.permissions : [];
};

const hasPermission = (userPermissions, requiredPermission) => {
  return userPermissions.includes(requiredPermission);
};

module.exports = {
  ROLES,
  getRolePermissions,
  hasPermission
};
