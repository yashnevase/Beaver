const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AgreementEvent = sequelize.define('AgreementEvent', {
    event_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    agreement_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    actor_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    event_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'agreement_events',
    timestamps: false,
    underscored: true,
    indexes: [
      { fields: ['agreement_id'] },
      { fields: ['actor_id'] },
      { fields: ['event_type'] },
      { fields: ['created_at'] }
    ]
  });

  return AgreementEvent;
};
