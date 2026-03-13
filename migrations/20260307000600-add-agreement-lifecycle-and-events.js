'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('agreements', 'agreement_number', {
      type: Sequelize.STRING(100),
      allowNull: true,
      unique: true
    });

    await queryInterface.addColumn('agreements', 'accepted_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('agreements', 'rejected_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('agreements', 'rejection_reason', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('agreements', 'activated_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('agreements', 'closed_at', {
      type: Sequelize.DATE,
      allowNull: true
    });

    await queryInterface.addColumn('agreements', 'closed_reason', {
      type: Sequelize.TEXT,
      allowNull: true
    });

    await queryInterface.addColumn('agreements', 'invite_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'invites', key: 'invite_id' },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE'
    });

    if (queryInterface.sequelize.options.dialect === 'postgres') {
      const statuses = ['pending_deposit', 'rejected', 'closed'];
      for (const status of statuses) {
        await queryInterface.sequelize.query(
          `ALTER TYPE "public"."enum_agreements_status" ADD VALUE IF NOT EXISTS '${status}'`
        ).catch(() => {}); // Ignore duplicate errors if not using IF NOT EXISTS
      }
    } else {
      await queryInterface.sequelize.query(
        "ALTER TABLE agreements MODIFY status ENUM('draft','pending_deposit','active','expired','revoked','rejected','closed') NOT NULL DEFAULT 'draft'"
      );
    }

    await queryInterface.addIndex('agreements', ['agreement_number']);
    await queryInterface.addIndex('agreements', ['invite_id']);

    await queryInterface.createTable('agreement_events', {
      event_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      agreement_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'agreements', key: 'agreement_id' },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      actor_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'user_id' },
        onDelete: 'SET NULL',
        onUpdate: 'CASCADE'
      },
      event_type: {
        type: Sequelize.STRING(100),
        allowNull: false
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      metadata: {
        type: Sequelize.JSON,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('agreement_events', ['agreement_id']);
    await queryInterface.addIndex('agreement_events', ['actor_id']);
    await queryInterface.addIndex('agreement_events', ['event_type']);
    await queryInterface.addIndex('agreement_events', ['created_at']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('agreement_events');
    await queryInterface.removeIndex('agreements', ['invite_id']);
    await queryInterface.removeIndex('agreements', ['agreement_number']);
    await queryInterface.sequelize.query(
      "ALTER TABLE agreements MODIFY status ENUM('draft','active','expired','revoked') NOT NULL DEFAULT 'draft'"
    );
    await queryInterface.removeColumn('agreements', 'invite_id');
    await queryInterface.removeColumn('agreements', 'closed_reason');
    await queryInterface.removeColumn('agreements', 'closed_at');
    await queryInterface.removeColumn('agreements', 'activated_at');
    await queryInterface.removeColumn('agreements', 'rejection_reason');
    await queryInterface.removeColumn('agreements', 'rejected_at');
    await queryInterface.removeColumn('agreements', 'accepted_at');
    await queryInterface.removeColumn('agreements', 'agreement_number');
  }
};
