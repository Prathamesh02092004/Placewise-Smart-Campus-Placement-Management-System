const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Job = sequelize.define('Job', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    recruiter_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(200),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    required_skills: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
      comment: 'Array of skill name strings specified by recruiter',
    },
    min_cgpa: {
      type: DataTypes.DECIMAL(3, 2),
      defaultValue: 0.0,
      validate: { min: 0, max: 10 },
    },
    eligible_branches: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Empty array means all branches eligible',
    },
    year_of_study: {
      type: DataTypes.TINYINT,
      allowNull: true,
      comment: 'null means all years eligible',
    },
    role_category: {
      type: DataTypes.STRING(80),
      allowNull: true,
      comment: 'Maps to a role profile JSON in the AI service',
    },
    location: {
      type: DataTypes.STRING(150),
      allowNull: true,
    },
    package_lpa: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    deadline: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    slots: {
      type: DataTypes.TINYINT,
      defaultValue: 1,
    },
    status: {
      type: DataTypes.ENUM('draft', 'active', 'closed'),
      defaultValue: 'draft',
    },
    approved_by: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
  }, {
    tableName: 'jobs',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['recruiter_id'] },
      { fields: ['status'] },
      { fields: ['deadline'] },
      { fields: ['role_category'] },
    ],
  });

  return Job;
};