const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ActionLog = sequelize.define('ActionLog', {
    log_id: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    action_type: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    module: {
      type: DataTypes.STRING(50),
      allowNull: false
    },
    entity_type: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    request_method: {
      type: DataTypes.STRING(10),
      allowNull: false
    },
    request_path: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    request_body: {
      type: DataTypes.JSON,
      allowNull: true
    },
    request_query: {
      type: DataTypes.JSON,
      allowNull: true
    },
    response_status: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    response_message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    execution_time_ms: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    error_message: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  }, {
    tableName: 'action_logs',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['action_type'] },
      { fields: ['module'] },
      { fields: ['created_at'] },
      { fields: ['request_method'] },
      { fields: ['response_status'] }
    ]
  });

  return ActionLog;
};
