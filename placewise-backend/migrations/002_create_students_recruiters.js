'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('students', {
      id:              { type: Sequelize.CHAR(36),      primaryKey: true },
      user_id:         { type: Sequelize.CHAR(36),      allowNull: false, unique: true,
                         references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      name:            { type: Sequelize.STRING(100),   allowNull: false },
      phone:           { type: Sequelize.STRING(15),    allowNull: true },
      cgpa:            { type: Sequelize.DECIMAL(4,2),  allowNull: true },
      branch:          { type: Sequelize.STRING(50),    allowNull: true },
      year_of_study:   { type: Sequelize.TINYINT,       allowNull: true },
      backlogs:        { type: Sequelize.TINYINT,       defaultValue: 0 },
      skills:          { type: Sequelize.JSON,          defaultValue: [] },
      resume_url:      { type: Sequelize.TEXT,          allowNull: true },
      internships:     { type: Sequelize.JSON,          defaultValue: [] },
      projects:        { type: Sequelize.JSON,          defaultValue: [] },
      certifications:  { type: Sequelize.JSON,          defaultValue: [] },
      verified_by:     { type: Sequelize.CHAR(36),      allowNull: true },
      is_verified:     { type: Sequelize.BOOLEAN,       defaultValue: false },
      profile_complete:{ type: Sequelize.BOOLEAN,       defaultValue: false },
      created_at:      { type: Sequelize.DATE,          allowNull: false },
      updated_at:      { type: Sequelize.DATE,          allowNull: false },
    });

    await queryInterface.createTable('recruiters', {
      id:                  { type: Sequelize.CHAR(36),    primaryKey: true },
      user_id:             { type: Sequelize.CHAR(36),    allowNull: false, unique: true,
                             references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      name:                { type: Sequelize.STRING(100), allowNull: false },
      company_name:        { type: Sequelize.STRING(150), allowNull: false },
      industry:            { type: Sequelize.STRING(100), allowNull: true },
      designation:         { type: Sequelize.STRING(100), allowNull: true },
      phone:               { type: Sequelize.STRING(15),  allowNull: true },
      website:             { type: Sequelize.STRING(255), allowNull: true },
      company_description: { type: Sequelize.TEXT,        allowNull: true },
      approved:            { type: Sequelize.BOOLEAN,     defaultValue: false },
      approved_by:         { type: Sequelize.CHAR(36),    allowNull: true },
      created_at:          { type: Sequelize.DATE,        allowNull: false },
      updated_at:          { type: Sequelize.DATE,        allowNull: false },
    });

    await queryInterface.createTable('placement_officers', {
      id:          { type: Sequelize.CHAR(36),   primaryKey: true },
      user_id:     { type: Sequelize.CHAR(36),   allowNull: false, unique: true,
                     references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      name:        { type: Sequelize.STRING(100), allowNull: false },
      department:  { type: Sequelize.STRING(100), allowNull: true },
      phone:       { type: Sequelize.STRING(15),  allowNull: true },
      employee_id: { type: Sequelize.STRING(50),  allowNull: true, unique: true },
      created_at:  { type: Sequelize.DATE,        allowNull: false },
      updated_at:  { type: Sequelize.DATE,        allowNull: false },
    });
  },

  async down(queryInterface) {
  await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  await queryInterface.dropTable('placement_officers');
  await queryInterface.dropTable('recruiters');
  await queryInterface.dropTable('students');
  await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
},
};