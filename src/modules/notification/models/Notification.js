const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    notification_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('due', 'chat', 'expiry', 'invite', 'payment', 'system'),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    sent_via: {
      type: DataTypes.ENUM('inapp', 'email', 'both'),
      allowNull: false,
      defaultValue: 'inapp'
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'notifications',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['type'] },
      { fields: ['read_at'] },
      { fields: ['user_id', 'read_at'], name: 'idx_user_unread' }
    ]
  });

  return Notification;
};
