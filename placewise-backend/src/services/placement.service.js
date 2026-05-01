'use strict';

const { Op, fn, col, QueryTypes } = require('sequelize');
const {
  PlacementRecord, Student, Job, Recruiter,
  Application, User, sequelize,
} = require('../models');
const { paginate } = require('../utils/paginate');

const createAppError = (msg, code) => {
  const e = new Error(msg); e.statusCode = code; return e;
};

/**
 * Live placement statistics.
 * Uses raw SQL for aggregations involving JOINs to avoid
 * Sequelize alias resolution bugs ("Unknown column 'students.branch'").
 */
const getStats = async () => {
  const totalStudents     = await Student.count();
  const verifiedStudents  = await Student.count({ where: { is_verified: true } });
  const totalPlaced       = await PlacementRecord.count();
  const activeJobs        = await Job.count({ where: { status: 'active' } });
  const totalApplications = await Application.count();
  const placementRate     = verifiedStudents > 0
    ? ((totalPlaced / verifiedStudents) * 100).toFixed(1)
    : 0;

  const avgResult = await PlacementRecord.findOne({
    attributes: [[fn('AVG', col('package_lpa')), 'avg']],
    raw: true,
  });

  // Raw SQL avoids Sequelize JOIN alias issues completely
  const branchBreakdown = await sequelize.query(
    `SELECT s.branch AS branch, COUNT(pr.id) AS count
     FROM placement_records pr
     INNER JOIN students s ON pr.student_id = s.id
     WHERE s.branch IS NOT NULL AND s.branch != ''
     GROUP BY s.branch
     ORDER BY count DESC`,
    { type: QueryTypes.SELECT }
  );

  const companyBreakdown = await sequelize.query(
    `SELECT r.company_name AS company,
            COUNT(pr.id)        AS count,
            AVG(pr.package_lpa) AS avg_package
     FROM placement_records pr
     INNER JOIN jobs j        ON pr.job_id      = j.id
     INNER JOIN recruiters r  ON j.recruiter_id = r.id
     GROUP BY r.company_name
     ORDER BY count DESC
     LIMIT 10`,
    { type: QueryTypes.SELECT }
  );

  return {
    totalStudents,
    verifiedStudents,
    totalPlaced,
    placementRate:    parseFloat(placementRate),
    avgPackage:       parseFloat(avgResult?.avg || 0).toFixed(2),
    activeJobs,
    totalApplications,
    branchBreakdown,
    companyBreakdown,
  };
};

/**
 * Paginated placement records with full associations.
 */
const getRecords = async (filters, pagination) => {
  return paginate(PlacementRecord, {
    include: [
      {
        model: Student,
        as: 'student',
        attributes: ['id', 'name', 'cgpa', 'branch'],
        include: [{ model: User, as: 'user', attributes: ['email'] }],
      },
      {
        model: Job,
        as: 'job',
        attributes: ['title', 'role_category', 'package_lpa'],
        include: [{
          model: Recruiter, as: 'recruiter',
          attributes: ['company_name'],
        }],
      },
    ],
    order: [['created_at', 'DESC']],
  }, pagination);
};

/**
 * Approve a recruiter / company registration.
 */
const approveCompany = async (recruiterId, officerUserId) => {
  const recruiter = await Recruiter.findByPk(recruiterId);
  if (!recruiter) throw createAppError('Recruiter not found.', 404);
  await recruiter.update({ approved: true, approved_by: officerUserId });
  return recruiter.reload();
};

/**
 * All companies awaiting approval.
 */
const getPendingCompanies = async () => {
  return Recruiter.findAll({
    where: { approved: false },
    include: [{ model: User, as: 'user', attributes: ['email', 'created_at'] }],
    order: [['created_at', 'ASC']],
  });
};

module.exports = { getStats, getRecords, approveCompany, getPendingCompanies };