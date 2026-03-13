const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Transaction = sequelize.define('Transaction', {
    transaction_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    agreement_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    paid_by: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('rent', 'deposit', 'expense', 'refund'),
      allowNull: false
    },
    amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: false
    },
    gst_amount: {
      type: DataTypes.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0
    },
    razorpay_order_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    razorpay_payment_id: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    razorpay_signature: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'),
      allowNull: false,
      defaultValue: 'pending'
    },
    due_date: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    paid_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    description: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    hash: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    previous_hash: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'transactions',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['agreement_id'] },
      { fields: ['paid_by'] },
      { fields: ['type'] },
      { fields: ['status'] },
      { fields: ['due_date'] },
      { fields: ['razorpay_order_id'] },
      { fields: ['razorpay_payment_id'] },
      { fields: ['agreement_id', 'due_date'], name: 'idx_agreement_due' }
    ]
  });

  return Transaction;
};
