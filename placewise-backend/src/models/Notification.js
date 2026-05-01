const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Notification = sequelize.define('Notification', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM(
        'application_status',
        'interview_scheduled',
        'offer_received',
        'skill_gap_ready',
        'profile_verified',
        'company_approved',
        'system'
      ),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    metadata: {
      type: DataTypes.JSON,
      defaultValue: {},
      comment: 'Extra payload e.g. { applicationId, jobTitle } for deep-linking',
    },
  }, {
    tableName: 'notifications',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['read'] },
      { fields: ['created_at'] },
    ],
  });

  return Notification;
};