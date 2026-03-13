const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Agreement = sequelize.define('Agreement', {
    agreement_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    agreement_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    property_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    owner_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    tenant_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    invite_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    rent_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    deposit_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0
    },
    rent_due_day: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      validate: { min: 1, max: 28 }
    },
    gst_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending_deposit', 'started', 'ended', 'closed', 'rejected'),
      allowNull: false,
      defaultValue: 'draft'
    },
    terms: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    pdf_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    accepted_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rejected_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    activated_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    closed_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    closed_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    revoked_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    revoke_reason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    renewed_from: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    certificate_number: {
      type: DataTypes.STRING(200),
      allowNull: true
    },
    started_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    ended_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'agreements',
    timestamps: true,
    underscored: true,
    paranoid: false,
    indexes: [
      { fields: ['property_id'] },
      { fields: ['owner_id'] },
      { fields: ['tenant_id'] },
      { fields: ['status'] },
      { fields: ['start_date'] },
      { fields: ['end_date'] },
      { fields: ['property_id', 'status'], name: 'idx_property_status' }
    ]
  });

  return Agreement;
};
