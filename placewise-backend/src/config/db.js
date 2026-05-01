const { Sequelize } = require('sequelize');
const env = require('./env');
const logger = require('../utils/logger');

const sequelize = new Sequelize(env.DB_NAME, env.DB_USER, env.DB_PASSWORD, {
  host: env.DB_HOST,
  port: env.DB_PORT,
  dialect: 'mysql',
  logging: env.NODE_ENV === 'development'
    ? (msg) => logger.debug(msg)
    : false,

  pool: {
    max: 10,       // max connections in pool
    min: 2,        // min connections kept alive
    acquire: 30000, // ms to wait before throwing error
    idle: 10000,   // ms a connection can sit idle before release
  },

  define: {
    // All tables use snake_case columns with timestamps
    underscored: true,
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  },

  dialectOptions:
    env.NODE_ENV === 'production'
      ? {
          ssl: {
            require: true,
            rejectUnauthorized: false,
          },
        }
      : {},
});

module.exports = sequelize;