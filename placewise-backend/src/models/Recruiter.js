const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Recruiter = sequelize.define('Recruiter', {
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
    company_name: {
      type: DataTypes.STRING(150),
      allowNull: false,
    },
    industry: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    designation: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    website: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    company_description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    approved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    approved_by: {
      type: DataTypes.CHAR(36),
      allowNull: true,
    },
  }, {
    tableName: 'recruiters',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['user_id'] }, { fields: ['company_name'] }],
  });

  return Recruiter;
};