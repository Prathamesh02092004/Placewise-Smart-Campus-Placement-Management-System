const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const SkillTaxonomy = sequelize.define('SkillTaxonomy', {
    id: {
      type: DataTypes.CHAR(36),
      primaryKey: true,
      defaultValue: DataTypes.UUIDV4,
    },
    skill_name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
    },
    category: {
      type: DataTypes.ENUM(
        'Frontend', 'Backend', 'AI/ML',
        'DevOps', 'Domain', 'Soft Skills'
      ),
      allowNull: false,
    },
    role_tags: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Array of role_category strings this skill belongs to',
    },
    market_demand: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0.0,
      comment: 'Demand score 0-100 refreshed weekly by cron job',
    },
    demand_trend: {
      type: DataTypes.ENUM('rising', 'stable', 'declining'),
      defaultValue: 'stable',
    },
    learning_urls: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Array of { platform, title, url, duration_hrs, is_free }',
    },
    aliases: {
      type: DataTypes.JSON,
      defaultValue: [],
      comment: 'Known aliases e.g. ["ReactJS", "React JS"] for React.js',
    },
  }, {
    tableName: 'skill_taxonomy',
    underscored: true,
    timestamps: true,
    indexes: [
      { fields: ['skill_name'] },
      { fields: ['category'] },
      { fields: ['market_demand'] },
    ],
  });

  return SkillTaxonomy;
};