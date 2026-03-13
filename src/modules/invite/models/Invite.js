const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Invite = sequelize.define('Invite', {
    invite_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    token: {
      type: DataTypes.STRING(500),
      unique: true,
      allowNull: false
    },
    property_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    invited_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    used_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'used', 'expired', 'revoked'),
      allowNull: false,
      defaultValue: 'pending'
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'invites',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['token'] },
      { fields: ['property_id'] },
      { fields: ['email'] },
      { fields: ['invited_by'] },
      { fields: ['status'] },
      { fields: ['expires_at'] }
    ]
  });

  return Invite;
};
