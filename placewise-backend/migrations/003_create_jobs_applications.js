'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jobs', {
      id:                { type: Sequelize.CHAR(36),     primaryKey: true },
      recruiter_id:      { type: Sequelize.CHAR(36),     allowNull: false,
                           references: { model: 'recruiters', key: 'id' }, onDelete: 'CASCADE' },
      title:             { type: Sequelize.STRING(200),  allowNull: false },
      description:       { type: Sequelize.TEXT,         allowNull: false },
      required_skills:   { type: Sequelize.JSON,         defaultValue: [] },
      min_cgpa:          { type: Sequelize.DECIMAL(3,2), defaultValue: 0.0 },
      eligible_branches: { type: Sequelize.JSON,         defaultValue: [] },
      year_of_study:     { type: Sequelize.TINYINT,      allowNull: true },
      role_category:     { type: Sequelize.STRING(80),   allowNull: true },
      location:          { type: Sequelize.STRING(150),  allowNull: true },
      package_lpa:       { type: Sequelize.DECIMAL(5,2), allowNull: true },
      deadline:          { type: Sequelize.DATE,         allowNull: true },
      slots:             { type: Sequelize.TINYINT,      defaultValue: 1 },
      status:            { type: Sequelize.ENUM('draft','active','closed'), defaultValue: 'draft' },
      approved_by:       { type: Sequelize.CHAR(36),     allowNull: true },
      created_at:        { type: Sequelize.DATE,         allowNull: false },
      updated_at:        { type: Sequelize.DATE,         allowNull: false },
    });

    await queryInterface.createTable('applications', {
      id:         { type: Sequelize.CHAR(36),     primaryKey: true },
      student_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: { model: 'students', key: 'id' },
        onDelete: 'CASCADE',
      },
      job_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: { model: 'jobs', key: 'id' },
        onDelete: 'CASCADE',
      },
      status: {
        type: Sequelize.ENUM(
          'applied', 'under_review', 'shortlisted',
          'interview_scheduled', 'offer_received', 'placed', 'rejected'
        ),
        defaultValue: 'applied',
      },
      ai_score:   { type: Sequelize.DECIMAL(5,2), allowNull: true },
      resume_url: { type: Sequelize.TEXT,         allowNull: true },
      applied_at: { type: Sequelize.DATE,         defaultValue: Sequelize.NOW },
      notes:      { type: Sequelize.TEXT,         allowNull: true },
      created_at: { type: Sequelize.DATE,         allowNull: false },
      updated_at: { type: Sequelize.DATE,         allowNull: false },
    });

    await queryInterface.addIndex('applications', ['student_id', 'job_id'], {
      unique: true,
      name: 'uq_applications_student_job',
    });

    await queryInterface.addIndex('applications', ['status'], {
      name: 'idx_applications_status',
    });

    await queryInterface.addIndex('applications', ['ai_score'], {
      name: 'idx_applications_ai_score',
    });
  },

  async down(queryInterface) {
  await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  await queryInterface.dropTable('applications');
  await queryInterface.dropTable('jobs');
  await queryInterface.sequelize.query('SET FOREIGN_KEY_CHECKS = 1');
},
};