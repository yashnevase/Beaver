const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AgreementDocument = sequelize.define('AgreementDocument', {
    document_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    agreement_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    uploaded_by: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    doc_type: {
      type: DataTypes.ENUM('certificate', 'registered_document', 'government_doc', 'identity', 'photo', 'other'),
      allowNull: false,
      defaultValue: 'certificate'
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    file_url: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    deleted_at: {
      type: DataTypes.DATE,
      allowNull: true
    }
  }, {
    tableName: 'agreement_documents',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    paranoid: true,
    deletedAt: 'deleted_at'
  });

  return AgreementDocument;
};
