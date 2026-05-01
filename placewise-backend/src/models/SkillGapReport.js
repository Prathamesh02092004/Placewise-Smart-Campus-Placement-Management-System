const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SkillGapReport = sequelize.define('SkillGapReport', {
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
    missing_skills: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Array of SkillDetail objects from AI service',
    },
    weak_skills: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Array of WeakSkillDetail objects from AI service',
    },
    market_demand_data: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Top 10 market skills for this role category',
    },
    severity: {
      type: DataTypes.ENUM('critical', 'moderate', 'ready'),
      allowNull: false,
    },
    overall_match: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    ai_analysis_raw: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: 'Full raw response from AI service for debugging',
    },
  }, {
    tableName: 'skill_gap_reports',
    underscored: true,
    timestamps: true,
    indexes: [
      { unique: true, fields: ['student_id', 'job_id'] },
      { fields: ['severity'] },
    ],
  });

  return SkillGapReport;
};