const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Interview = sequelize.define('Interview', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    application_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      unique: true,
    },
    scheduled_at: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    mode: {
      type: DataTypes.ENUM('online', 'offline'),
      allowNull: false,
    },
    video_link: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    venue: {
      type: DataTypes.STRING(300),
      allowNull: true,
    },
    duration_minutes: {
      type: DataTypes.SMALLINT,
      defaultValue: 60,
    },
    round: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
      comment: 'Interview round number (1 = first round)',
    },
    result: {
      type: DataTypes.ENUM('pending', 'selected', 'rejected', 'no_show'),
      defaultValue: 'pending',
    },
    feedback: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Recruiter feedback after interview — internal only',
    },
  }, {
    tableName: 'interviews',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['application_id'] },
      { fields: ['scheduled_at'] },
    ],
  });

  return Interview;
};