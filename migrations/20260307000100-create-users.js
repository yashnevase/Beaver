'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      user_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      email: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      full_name: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      phone: {
        type: Sequelize.STRING(15),
        allowNull: true
      },
      role: {
        type: Sequelize.ENUM('owner', 'tenant', 'admin'),
        allowNull: false,
        defaultValue: 'tenant'
      },
      tier: {
        type: Sequelize.ENUM('free', 'pro'),
        allowNull: false,
        defaultValue: 'free'
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      last_login_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      password_reset_token: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      password_reset_token_expires_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      refresh_token_version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      profile_photo: {
        type: Sequelize.STRING(500),
        allowNull: true
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('users', ['email']);
    await queryInterface.addIndex('users', ['role']);
    await queryInterface.addIndex('users', ['tier']);
    await queryInterface.addIndex('users', ['is_active']);
    await queryInterface.addIndex('users', ['deleted_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('users');
  }
};
