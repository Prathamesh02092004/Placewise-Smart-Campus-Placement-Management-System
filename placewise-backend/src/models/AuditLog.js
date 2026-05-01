const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      comment: 'null for system-triggered actions',
    },
    action: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'e.g. CREATE, UPDATE, DELETE, STATUS_CHANGE',
    },
    entity: {
      type: DataTypes.STRING(50),
      allowNull: false,
      comment: 'e.g. Job, Application, User',
    },
    entity_id: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
    old_value: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    new_value: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    diff: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'DeepDiff output between old_value and new_value',
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  }, {
    tableName: 'audit_logs',
    underscored: true,
    timestamps: true,
    updatedAt: false, 
    indexes: [
      { fields: ['user_id'] },
      { fields: ['entity'] },
      { fields: ['action'] },
      { fields: ['created_at'] },
    ],
  });

  return AuditLog;
};