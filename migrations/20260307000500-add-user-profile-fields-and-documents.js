'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'address_line', {
      type: Sequelize.STRING(255),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'city', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'state', {
      type: Sequelize.STRING(100),
      allowNull: true
    });

    await queryInterface.addColumn('users', 'pincode', {
      type: Sequelize.STRING(10),
      allowNull: true
    });

    await queryInterface.createTable('documents', {
      document_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'user_id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      doc_type: {
        type: Sequelize.ENUM('aadhaar', 'pan', 'address_proof', 'photo'),
        allowNull: false
      },
      doc_number: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      file_url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      uploaded_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
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

    await queryInterface.addIndex('documents', ['user_id']);
    await queryInterface.addIndex('documents', ['doc_type']);
    await queryInterface.addIndex('documents', ['verified']);
    await queryInterface.addIndex('documents', ['deleted_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('documents');
    await queryInterface.removeColumn('users', 'pincode');
    await queryInterface.removeColumn('users', 'state');
    await queryInterface.removeColumn('users', 'city');
    await queryInterface.removeColumn('users', 'address_line');
  }
};
