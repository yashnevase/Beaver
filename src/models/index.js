const { Sequelize } = require('sequelize');
const sequelize = require('../config/db');

const db = {};

// Core models
db.User = require('../modules/user/models/User')(sequelize);
db.Document = require('../modules/user/models/Document')(sequelize);
db.RefreshToken = require('../modules/auth/models/RefreshToken')(sequelize);
db.Otp = require('../modules/auth/models/Otp')(sequelize);
db.ActionLog = require('../modules/shared/models/ActionLog')(sequelize);
db.AuditLog = require('./AuditLog')(sequelize);

// Beaver domain models
db.Property = require('../modules/property/models/Property')(sequelize);
db.Invite = require('../modules/invite/models/Invite')(sequelize);
db.Agreement = require('../modules/agreement/models/Agreement')(sequelize);
db.AgreementEvent = require('../modules/agreement/models/AgreementEvent')(sequelize);
db.Transaction = require('../modules/transaction/models/Transaction')(sequelize);
db.AgreementDocument = require('../modules/agreement/models/AgreementDocument')(sequelize);
db.Chat = require('../modules/chat/models/Chat')(sequelize);
db.Notification = require('../modules/notification/models/Notification')(sequelize);
db.PropertyImage = require('../modules/property/models/PropertyImage')(sequelize);

// --- Associations ---

db.Document.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
db.User.hasMany(db.Document, { foreignKey: 'user_id', as: 'documents' });

// Auth
db.RefreshToken.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
db.User.hasMany(db.RefreshToken, { foreignKey: 'user_id', as: 'refreshTokens' });

db.Otp.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
db.User.hasMany(db.Otp, { foreignKey: 'user_id', as: 'otps' });

// Property
db.Property.belongsTo(db.User, { foreignKey: 'owner_id', as: 'owner' });
db.User.hasMany(db.Property, { foreignKey: 'owner_id', as: 'properties' });

// Invite
db.Invite.belongsTo(db.Property, { foreignKey: 'property_id', as: 'property' });
db.Invite.belongsTo(db.User, { foreignKey: 'invited_by', as: 'inviter' });
db.Invite.belongsTo(db.User, { foreignKey: 'used_by', as: 'acceptedUser' });
db.Invite.hasMany(db.Agreement, { foreignKey: 'invite_id', as: 'agreements' });

// Agreement
db.Agreement.belongsTo(db.Property, { foreignKey: 'property_id', as: 'property' });
db.Agreement.belongsTo(db.User, { foreignKey: 'owner_id', as: 'owner' });
db.Agreement.belongsTo(db.User, { foreignKey: 'tenant_id', as: 'tenant' });
db.Agreement.belongsTo(db.Invite, { foreignKey: 'invite_id', as: 'invite' });
db.Property.hasMany(db.Agreement, { foreignKey: 'property_id', as: 'agreements' });
db.PropertyImage.belongsTo(db.Property, { foreignKey: 'property_id', as: 'property' });
db.Property.hasMany(db.PropertyImage, { foreignKey: 'property_id', as: 'images' });
db.User.hasMany(db.Agreement, { foreignKey: 'owner_id', as: 'ownedAgreements' });
db.User.hasMany(db.Agreement, { foreignKey: 'tenant_id', as: 'tenantAgreements' });
db.AgreementEvent.belongsTo(db.Agreement, { foreignKey: 'agreement_id', as: 'agreement' });
db.AgreementEvent.belongsTo(db.User, { foreignKey: 'actor_id', as: 'actor' });
db.Agreement.hasMany(db.AgreementEvent, { foreignKey: 'agreement_id', as: 'events' });
db.AgreementDocument.belongsTo(db.Agreement, { foreignKey: 'agreement_id', as: 'agreement' });
db.AgreementDocument.belongsTo(db.User, { foreignKey: 'uploaded_by', as: 'uploader' });
db.Agreement.hasMany(db.AgreementDocument, { foreignKey: 'agreement_id', as: 'documents' });
db.Agreement.belongsTo(db.Agreement, { foreignKey: 'renewed_from', as: 'parentAgreement' });

// Transaction
db.Transaction.belongsTo(db.Agreement, { foreignKey: 'agreement_id', as: 'agreement' });
db.Agreement.hasMany(db.Transaction, { foreignKey: 'agreement_id', as: 'transactions' });
db.Transaction.belongsTo(db.User, { foreignKey: 'paid_by', as: 'payer' });

// Chat
db.Chat.belongsTo(db.Agreement, { foreignKey: 'agreement_id', as: 'agreement' });
db.Chat.belongsTo(db.User, { foreignKey: 'sender_id', as: 'sender' });
db.Agreement.hasMany(db.Chat, { foreignKey: 'agreement_id', as: 'chats' });

// Notification
db.Notification.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
db.User.hasMany(db.Notification, { foreignKey: 'user_id', as: 'notifications' });

// Logs
db.ActionLog.belongsTo(db.User, { foreignKey: 'user_id', as: 'user' });
db.AuditLog.belongsTo(db.User, { foreignKey: 'actor_id', as: 'actor' });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
