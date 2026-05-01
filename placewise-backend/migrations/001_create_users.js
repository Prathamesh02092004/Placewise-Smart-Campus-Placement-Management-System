'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id:                       { type: Sequelize.CHAR(36),    primaryKey: true, allowNull: false },
      email:                    { type: Sequelize.STRING(255), allowNull: false, unique: true },
      password_hash:            { type: Sequelize.STRING(255), allowNull: false },
      role:                     { type: Sequelize.ENUM('student','recruiter','placement','admin'), allowNull: false },
      is_active:                { type: Sequelize.BOOLEAN,     defaultValue: true },
      email_verified:           { type: Sequelize.BOOLEAN,     defaultValue: false },
      email_verification_token: { type: Sequelize.STRING(255), allowNull: true },
      password_reset_token:     { type: Sequelize.STRING(255), allowNull: true },
      password_reset_expires:   { type: Sequelize.DATE,        allowNull: true },
      refresh_token:            { type: Sequelize.TEXT,        allowNull: true },
      refresh_expires:          { type: Sequelize.DATE,        allowNull: true },
      created_at:               { type: Sequelize.DATE,        allowNull: false },
      updated_at:               { type: Sequelize.DATE,        allowNull: false },
    });
  },

  async down(queryInterface) {
  await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  await queryInterface.dropTable('users');
  await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
},
};