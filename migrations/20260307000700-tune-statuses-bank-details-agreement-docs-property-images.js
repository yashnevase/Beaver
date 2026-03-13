'use strict';

const addColumnIfNotExists = async (qi, table, column, definition) => {
  const [cols] = await qi.sequelize.query(
    `SHOW COLUMNS FROM \`${table}\` WHERE Field = '${column}'`
  );
  if (cols.length === 0) {
    await qi.addColumn(table, column, definition);
  }
};

const tableExists = async (qi, table) => {
  const [rows] = await qi.sequelize.query(
    `SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE' AND TABLE_NAME = '${table}' AND TABLE_SCHEMA = DATABASE()`
  );
  return rows.length > 0;
};

module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. User: add bank details, dob, gender (idempotent)
    await addColumnIfNotExists(queryInterface, 'users', 'bank_account_number', {
      type: Sequelize.STRING(50), allowNull: true
    });
    await addColumnIfNotExists(queryInterface, 'users', 'bank_ifsc', {
      type: Sequelize.STRING(20), allowNull: true
    });
    await addColumnIfNotExists(queryInterface, 'users', 'bank_name', {
      type: Sequelize.STRING(200), allowNull: true
    });
    await addColumnIfNotExists(queryInterface, 'users', 'date_of_birth', {
      type: Sequelize.DATEONLY, allowNull: true
    });
    await addColumnIfNotExists(queryInterface, 'users', 'gender', {
      type: Sequelize.ENUM('male', 'female', 'other'), allowNull: true
    });

    // 2. Agreement: change status enum, add renewed_from, certificate_number
    // First expand enum to include ALL old + new values so data migration works
    await queryInterface.sequelize.query(
      "ALTER TABLE agreements MODIFY status ENUM('draft','pending_deposit','active','expired','revoked','rejected','closed','started','ended') NOT NULL DEFAULT 'draft'"
    );

    // Now migrate existing data to new statuses
    await queryInterface.sequelize.query(
      "UPDATE agreements SET status = 'started' WHERE status = 'active'"
    );
    await queryInterface.sequelize.query(
      "UPDATE agreements SET status = 'closed' WHERE status = 'revoked'"
    );
    await queryInterface.sequelize.query(
      "UPDATE agreements SET status = 'ended' WHERE status = 'expired'"
    );

    // Now shrink enum to only the final set
    await queryInterface.sequelize.query(
      "ALTER TABLE agreements MODIFY status ENUM('draft','pending_deposit','started','ended','closed','rejected') NOT NULL DEFAULT 'draft'"
    );

    await addColumnIfNotExists(queryInterface, 'agreements', 'renewed_from', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'agreements', key: 'agreement_id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    await addColumnIfNotExists(queryInterface, 'agreements', 'certificate_number', {
      type: Sequelize.STRING(200), allowNull: true
    });

    await addColumnIfNotExists(queryInterface, 'agreements', 'started_at', {
      type: Sequelize.DATE, allowNull: true
    });

    await addColumnIfNotExists(queryInterface, 'agreements', 'ended_at', {
      type: Sequelize.DATE, allowNull: true
    });

    // Copy activated_at to started_at for existing records
    await queryInterface.sequelize.query(
      "UPDATE agreements SET started_at = activated_at WHERE activated_at IS NOT NULL"
    );

    // 3. Agreement documents table
    if (!(await tableExists(queryInterface, 'agreement_documents'))) {
    await queryInterface.createTable('agreement_documents', {
      document_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      agreement_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'agreements', key: 'agreement_id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      uploaded_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'user_id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      doc_type: {
        type: Sequelize.ENUM('certificate', 'photo', 'other'),
        allowNull: false,
        defaultValue: 'certificate'
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      file_url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    await queryInterface.addIndex('agreement_documents', ['agreement_id'], { name: 'agreement_documents_agreement_id' });
    await queryInterface.addIndex('agreement_documents', ['uploaded_by'], { name: 'agreement_documents_uploaded_by' });
    }

    // 4. Property images table
    if (!(await tableExists(queryInterface, 'property_images'))) {
    await queryInterface.createTable('property_images', {
      image_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      property_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'properties', key: 'property_id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      file_url: {
        type: Sequelize.STRING(500),
        allowNull: false
      },
      caption: {
        type: Sequelize.STRING(255),
        allowNull: true
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deleted_at: {
        type: Sequelize.DATE,
        allowNull: true
      }
    });

    await queryInterface.addIndex('property_images', ['property_id'], { name: 'property_images_property_id' });
    await queryInterface.addIndex('property_images', ['deleted_at'], { name: 'property_images_deleted_at' });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('property_images');
    await queryInterface.dropTable('agreement_documents');
    await queryInterface.removeColumn('agreements', 'ended_at');
    await queryInterface.removeColumn('agreements', 'started_at');
    await queryInterface.removeColumn('agreements', 'certificate_number');
    await queryInterface.removeColumn('agreements', 'renewed_from');
    await queryInterface.sequelize.query(
      "ALTER TABLE agreements MODIFY status ENUM('draft','pending_deposit','active','expired','revoked','rejected','closed') NOT NULL DEFAULT 'draft'"
    );
    await queryInterface.removeColumn('users', 'gender');
    await queryInterface.removeColumn('users', 'date_of_birth');
    await queryInterface.removeColumn('users', 'bank_name');
    await queryInterface.removeColumn('users', 'bank_ifsc');
    await queryInterface.removeColumn('users', 'bank_account_number');
  }
};
