const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PlacementOfficer = sequelize.define('PlacementOfficer', {
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
    department: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    phone: {
      type: DataTypes.STRING(15),
      allowNull: true,
    },
    employee_id: {
      type: DataTypes.STRING(50),
      allowNull: true,
      unique: true,
    },
  }, {
    tableName: 'placement_officers',
    underscored: true,
    timestamps: true,
    indexes: [{ fields: ['user_id'] }],
  });

  return PlacementOfficer;
};