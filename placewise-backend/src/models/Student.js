const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Student = sequelize.define('Student', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    user_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    cgpa: {
      type: DataTypes.DECIMAL(4, 2),
      allowNull: true,
      validate: { min: 0, max: 10 },
    },
    branch: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    year_of_study: {
      type: DataTypes.TINYINT,
      allowNull: true,
      validate: { min: 1, max: 4 },
    },
    backlogs: {
      type: DataTypes.TINYINT,
      defaultValue: 0,
    },
    skills: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Array of { skill_name, proficiency_signal } objects from resume parser',
    },
    resume_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    internships: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    projects: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    certifications: {
      type: DataTypes.JSON,
      defaultValue: [],
    },
    verified_by: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      comment: 'User ID of the placement officer who verified this profile',
    },
    is_verified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    profile_complete: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'students',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['branch'] },
      { fields: ['cgpa'] },
    ],
  });

  return Student;
};