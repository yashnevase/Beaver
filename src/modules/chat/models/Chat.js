const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Chat = sequelize.define('Chat', {
    chat_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    agreement_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    sender_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'chats',
    timestamps: true,
    underscored: true,
    paranoid: true,
    indexes: [
      { fields: ['agreement_id'] },
      { fields: ['sender_id'] },
      { fields: ['created_at'] },
      { fields: ['agreement_id', 'created_at'], name: 'idx_agreement_chat_time' }
    ]
  });

  return Chat;
};
