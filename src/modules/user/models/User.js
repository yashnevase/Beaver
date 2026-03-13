const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    user_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    email: {
      type: DataTypes.STRING(255),
      unique: true,
      allowNull: false,
      validate: {
        isEmail: true
      }
    },
    password_hash: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    full_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: true
    },
    address_line: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    pincode: {
      type: DataTypes.STRING(10),
      allowNull: true
    },
    bank_account_number: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    bank_ifsc: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    bank_name: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    date_of_birth: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    gender: {
      type: DataTypes.ENUM('male', 'female', 'other'),
      allowNull: true
    },
    role: {
      type: DataTypes.ENUM('owner', 'tenant', 'admin'),
      allowNull: false,
      defaultValue: 'tenant'
    },
    tier: {
      type: DataTypes.ENUM('free', 'pro'),
      allowNull: false,
      defaultValue: 'free'
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    email_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    password_reset_token: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    password_reset_token_expires_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    refresh_token_version: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    profile_photo: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'users',
    timestamps: true,
    underscored: true,
    paranoid: false,
    indexes: [
      { fields: ['email'] },
      { fields: ['role'] },
      { fields: ['tier'] },
      { fields: ['is_active'] },
      { fields: ['deleted_at'] }
    ]
  });
  
  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password_hash;
    delete values.password_reset_token;
    return values;
  };
  
  return User;
};
