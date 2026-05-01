const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Application = sequelize.define('Application', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    student_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    job_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        'applied',
        'under_review',
        'shortlisted',
        'interview_scheduled',
        'offer_received',
        'placed',
        'rejected'
      ),
      defaultValue: 'applied',
    },
    ai_score: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Match score 0-100 computed by AI service',
    },
    resume_url: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Snapshot of resume URL at time of application',
    },
    applied_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Internal recruiter notes — not visible to student',
    },
  }, {
    tableName: 'applications',
    underscored: true,
    timestamps: true,
    indexes: [
      { unique: true, fields: ['student_id', 'job_id'] },
      { fields: ['status'] },
      { fields: ['ai_score'] },
      { fields: ['job_id'] },
    ],
  });

  return Application;
};