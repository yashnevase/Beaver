const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Document = sequelize.define('Document', {
    document_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    doc_type: {
      type: DataTypes.ENUM('aadhaar', 'pan', 'address_proof', 'photo'),
      allowNull: false
    },
    doc_number: {
      type: DataTypes.STRING(100),
      allowNull: true
    },
    file_url: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    verified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    uploaded_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'documents',
    timestamps: true,
    underscored: true,
    paranoid: true,
    deletedAt: 'deleted_at',
    updatedAt: 'updated_at',
    createdAt: 'created_at',
    indexes: [
      { fields: ['user_id'] },
      { fields: ['doc_type'] },
      { fields: ['verified'] },
      { fields: ['deleted_at'] }
    ]
  });

  return Document;
};
