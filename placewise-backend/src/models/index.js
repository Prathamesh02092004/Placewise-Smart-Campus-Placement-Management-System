'use strict';

const sequelize = require('../config/db');

// Loading all models 
const User            = require('./User')(sequelize);
const Student         = require('./Student')(sequelize);
const Recruiter       = require('./Recruiter')(sequelize);
const PlacementOfficer= require('./PlacementOfficer')(sequelize);
const Job             = require('./Job')(sequelize);
const Application     = require('./Application')(sequelize);
const Interview       = require('./Interview')(sequelize);
const SkillTaxonomy   = require('./SkillTaxonomy')(sequelize);
const SkillGapReport  = require('./SkillGapReport')(sequelize);
const PlacementRecord = require('./PlacementRecord')(sequelize);
const Notification    = require('./Notification')(sequelize);
const AuditLog        = require('./AuditLog')(sequelize);

//Associations

// User <-> Student (one-to-one)
User.hasOne(Student,          { foreignKey: 'user_id', as: 'studentProfile', onDelete: 'CASCADE' });
Student.belongsTo(User,       { foreignKey: 'user_id', as: 'user' });

// User <-> Recruiter (one-to-one)
User.hasOne(Recruiter,        { foreignKey: 'user_id', as: 'recruiterProfile', onDelete: 'CASCADE' });
Recruiter.belongsTo(User,     { foreignKey: 'user_id', as: 'user' });

// User <-> PlacementOfficer (one-to-one)
User.hasOne(PlacementOfficer, { foreignKey: 'user_id', as: 'officerProfile', onDelete: 'CASCADE' });
PlacementOfficer.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Recruiter <-> Job (one-to-many)
Recruiter.hasMany(Job,        { foreignKey: 'recruiter_id', as: 'jobs', onDelete: 'CASCADE' });
Job.belongsTo(Recruiter,      { foreignKey: 'recruiter_id', as: 'recruiter' });

// Student <-> Application (one-to-many)
Student.hasMany(Application,  { foreignKey: 'student_id', as: 'applications', onDelete: 'CASCADE' });
Application.belongsTo(Student,{ foreignKey: 'student_id', as: 'student' });

// Job <-> Application (one-to-many)
Job.hasMany(Application,      { foreignKey: 'job_id', as: 'applications', onDelete: 'CASCADE' });
Application.belongsTo(Job,    { foreignKey: 'job_id', as: 'job' });

// Application <-> Interview (one-to-one)
Application.hasOne(Interview, { foreignKey: 'application_id', as: 'interview', onDelete: 'CASCADE' });
Interview.belongsTo(Application, { foreignKey: 'application_id', as: 'application' });

// Application <-> PlacementRecord (one-to-one)
Application.hasOne(PlacementRecord, { foreignKey: 'application_id', as: 'placementRecord', onDelete: 'CASCADE' });
PlacementRecord.belongsTo(Application, { foreignKey: 'application_id', as: 'application' });

// Student <-> PlacementRecord (one-to-many)
Student.hasMany(PlacementRecord, { foreignKey: 'student_id', as: 'placements' });
PlacementRecord.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

// Job <-> PlacementRecord (one-to-many)
Job.hasMany(PlacementRecord,  { foreignKey: 'job_id', as: 'placements' });
PlacementRecord.belongsTo(Job,{ foreignKey: 'job_id', as: 'job' });

// Student <-> SkillGapReport (one-to-many)
Student.hasMany(SkillGapReport, { foreignKey: 'student_id', as: 'skillGapReports', onDelete: 'CASCADE' });
SkillGapReport.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

// Job <-> SkillGapReport (one-to-many)
Job.hasMany(SkillGapReport,   { foreignKey: 'job_id', as: 'skillGapReports', onDelete: 'CASCADE' });
SkillGapReport.belongsTo(Job, { foreignKey: 'job_id', as: 'job' });

// User <-> Notification (one-to-many)
User.hasMany(Notification,    { foreignKey: 'user_id', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User,  { foreignKey: 'user_id', as: 'user' });

// User <-> AuditLog (one-to-many, nullable FK)
User.hasMany(AuditLog,        { foreignKey: 'user_id', as: 'auditLogs' });
AuditLog.belongsTo(User,      { foreignKey: 'user_id', as: 'user' });

module.exports = {
  sequelize,
  User,
  Student,
  Recruiter,
  PlacementOfficer,
  Job,
  Application,
  Interview,
  SkillTaxonomy,
  SkillGapReport,
  PlacementRecord,
  Notification,
  AuditLog,
};