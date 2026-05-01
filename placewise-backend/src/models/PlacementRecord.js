const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PlacementRecord = sequelize.define('PlacementRecord', {
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
    application_id: {
      type: DataTypes.CHAR(36),
      allowNull: false,
      unique: true,
    },
    package_lpa: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    joining_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    offer_letter_url: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    confirmed_by: {
      type: DataTypes.CHAR(36),
      allowNull: true,
      comment: 'User ID of placement officer who confirmed this record',
    },
  }, {
    tableName: 'placement_records',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['student_id'] },
      { fields: ['job_id'] },
    ],
  });

  return PlacementRecord;
};