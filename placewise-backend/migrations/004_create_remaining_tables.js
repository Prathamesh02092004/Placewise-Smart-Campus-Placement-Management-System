'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // interviews
    await queryInterface.createTable('interviews', {
      id:               { type: Sequelize.CHAR(36),   primaryKey: true },
      application_id:   { type: Sequelize.CHAR(36),   allowNull: false, unique: true,
                          references: { model: 'applications', key: 'id' }, onDelete: 'CASCADE' },
      scheduled_at:     { type: Sequelize.DATE,        allowNull: false },
      mode:             { type: Sequelize.ENUM('online','offline'), allowNull: false },
      video_link:       { type: Sequelize.STRING(500), allowNull: true },
      venue:            { type: Sequelize.STRING(300), allowNull: true },
      duration_minutes: { type: Sequelize.SMALLINT,   defaultValue: 60 },
      round:            { type: Sequelize.TINYINT,    defaultValue: 1 },
      result:           { type: Sequelize.ENUM('pending','selected','rejected','no_show'), defaultValue: 'pending' },
      feedback:         { type: Sequelize.TEXT,        allowNull: true },
      created_at:       { type: Sequelize.DATE,        allowNull: false },
      updated_at:       { type: Sequelize.DATE,        allowNull: false },
    });

    // skill_taxonomy
    await queryInterface.createTable('skill_taxonomy', {
      id:            { type: Sequelize.CHAR(36),   primaryKey: true },
      skill_name:    { type: Sequelize.STRING(100), allowNull: false, unique: true },
      category:      { type: Sequelize.ENUM('Frontend','Backend','AI/ML','DevOps','Domain','Soft Skills'), allowNull: false },
      role_tags:     { type: Sequelize.JSON,        defaultValue: [] },
      market_demand: { type: Sequelize.DECIMAL(5,2),defaultValue: 0.0 },
      demand_trend:  { type: Sequelize.ENUM('rising','stable','declining'), defaultValue: 'stable' },
      learning_urls: { type: Sequelize.JSON,        defaultValue: [] },
      aliases:       { type: Sequelize.JSON,        defaultValue: [] },
      created_at:    { type: Sequelize.DATE,        allowNull: false },
      updated_at:    { type: Sequelize.DATE,        allowNull: false },
    });

    // skill_gap_reports
    await queryInterface.createTable('skill_gap_reports', {
      id:                { type: Sequelize.CHAR(36),  primaryKey: true },
      student_id:        { type: Sequelize.CHAR(36),  allowNull: false,
                           references: { model: 'students', key: 'id' }, onDelete: 'CASCADE' },
      job_id:            { type: Sequelize.CHAR(36),  allowNull: false,
                           references: { model: 'jobs', key: 'id' }, onDelete: 'CASCADE' },
      missing_skills:    { type: Sequelize.JSON,      defaultValue: [] },
      weak_skills:       { type: Sequelize.JSON,      defaultValue: [] },
      market_demand_data:{ type: Sequelize.JSON,      defaultValue: [] },
      severity:          { type: Sequelize.ENUM('critical','moderate','ready'), allowNull: false },
      overall_match:     { type: Sequelize.DECIMAL(5,2), allowNull: true },
      ai_analysis_raw:   { type: Sequelize.JSON,      allowNull: true },
      created_at:        { type: Sequelize.DATE,      allowNull: false },
      updated_at:        { type: Sequelize.DATE,      allowNull: false },
    });
    await queryInterface.addIndex('skill_gap_reports', ['student_id', 'job_id'], { unique: true });

    // placement_records
    await queryInterface.createTable('placement_records', {
      id:               { type: Sequelize.CHAR(36),   primaryKey: true },
      student_id:       { type: Sequelize.CHAR(36),   allowNull: false,
                          references: { model: 'students', key: 'id' } },
      job_id:           { type: Sequelize.CHAR(36),   allowNull: false,
                          references: { model: 'jobs', key: 'id' } },
      application_id:   { type: Sequelize.CHAR(36),   allowNull: false, unique: true,
                          references: { model: 'applications', key: 'id' } },
      package_lpa:      { type: Sequelize.DECIMAL(5,2), allowNull: true },
      joining_date:     { type: Sequelize.DATEONLY,   allowNull: true },
      offer_letter_url: { type: Sequelize.TEXT,        allowNull: true },
      confirmed_by:     { type: Sequelize.CHAR(36),   allowNull: true },
      created_at:       { type: Sequelize.DATE,        allowNull: false },
      updated_at:       { type: Sequelize.DATE,        allowNull: false },
    });

    // notifications
    await queryInterface.createTable('notifications', {
      id:         { type: Sequelize.CHAR(36),   primaryKey: true },
      user_id:    { type: Sequelize.CHAR(36),   allowNull: false,
                    references: { model: 'users', key: 'id' }, onDelete: 'CASCADE' },
      type:       {
        type: Sequelize.ENUM('application_status','interview_scheduled','offer_received',
                             'skill_gap_ready','profile_verified','company_approved','system'),
        allowNull: false,
      },
      title:      { type: Sequelize.STRING(200), allowNull: false },
      message:    { type: Sequelize.TEXT,        allowNull: false },
      read:       { type: Sequelize.BOOLEAN,     defaultValue: false },
      metadata:   { type: Sequelize.JSON,        defaultValue: {} },
      created_at: { type: Sequelize.DATE,        allowNull: false },
      updated_at: { type: Sequelize.DATE,        allowNull: false },
    });
    await queryInterface.addIndex('notifications', ['user_id']);
    await queryInterface.addIndex('notifications', ['read']);

    // audit_logs
    await queryInterface.createTable('audit_logs', {
      id:          { type: Sequelize.CHAR(36),   primaryKey: true },
      user_id:     { type: Sequelize.CHAR(36),   allowNull: true,
                     references: { model: 'users', key: 'id' } },
      action:      { type: Sequelize.STRING(50), allowNull: false },
      entity:      { type: Sequelize.STRING(50), allowNull: false },
      entity_id:   { type: Sequelize.CHAR(36),   allowNull: true },
      old_value:   { type: Sequelize.JSON,        allowNull: true },
      new_value:   { type: Sequelize.JSON,        allowNull: true },
      diff:        { type: Sequelize.JSON,        allowNull: true },
      ip_address:  { type: Sequelize.STRING(45), allowNull: true },
      user_agent:  { type: Sequelize.TEXT,        allowNull: true },
      created_at:  { type: Sequelize.DATE,        allowNull: false },
    });
    await queryInterface.addIndex('audit_logs', ['user_id']);
    await queryInterface.addIndex('audit_logs', ['entity']);
    await queryInterface.addIndex('audit_logs', ['created_at']);
  },

  async down(queryInterface) {
  await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  await queryInterface.dropTable('audit_logs');
  await queryInterface.dropTable('notifications');
  await queryInterface.dropTable('placement_records');
  await queryInterface.dropTable('skill_gap_reports');
  await queryInterface.dropTable('skill_taxonomy');
  await queryInterface.dropTable('interviews');
},
};