const { Op } = require('sequelize');
const { Job, Recruiter, Application, Student, User } = require('../models');
const { paginate, getPaginationParams } = require('../utils/paginate');

/**
 * Builds pagination metadata from a raw count and pagination params.
 * Used in listJobs and getRecruiterJobs which bypass the paginate() helper
 * because they need manual findAndCountAll (for subquery attributes).
 */
const buildPaginationMeta = (count, { page = 1, limit = 10 } = {}) => {
  const pageNum  = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const totalPages = Math.ceil(count / limitNum);
  return {
    total:       count,
    page:        pageNum,
    limit:       limitNum,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
  };
};
const axios = require('axios');
const logger = require('../utils/logger');

const AI_URL    = process.env.AI_SERVICE_URL;
const AI_SECRET = process.env.AI_SERVICE_SECRET;

const createAppError = (msg, code) => {
  const e = new Error(msg); e.statusCode = code; return e;
};

/**
 * Get paginated active jobs, optionally filtered.
 * Each job is enriched with a pre-computed AI match score if studentProfile is provided.
 */
const listJobs = async (filters, pagination, requestingUser) => {
  const where = {}

  const privilegedRoles = ['placement', 'admin']
  if (filters.status) {
    where.status = filters.status
  } else if (!requestingUser || !privilegedRoles.includes(requestingUser.role)) {
    where.status = 'active'
  }

  if (filters.role_category) where.role_category = filters.role_category
  if (filters.search) {
    where[Op.or] = [
      { title:       { [Op.like]: `%${filters.search}%` } },
      { description: { [Op.like]: `%${filters.search}%` } },
    ]
  }

  const pageNum  = Math.max(1, parseInt(pagination.page  || 1,  10));
  const limitNum = Math.min(100, Math.max(1, parseInt(pagination.limit || 10, 10)));
  const offset   = (pageNum - 1) * limitNum;

  const { count, rows } = await Job.findAndCountAll({
    where,
    include: [{
      model: Recruiter,
      as: 'recruiter',
      attributes: ['company_name', 'industry', 'website'],
    }],
    attributes: {
      include: [
        [
          require('sequelize').literal(
            `(SELECT COUNT(*) FROM applications WHERE applications.job_id = Job.id)`
          ),
          'applicant_count',
        ],
      ],
    },
    order:    [['created_at', 'DESC']],
    limit:    limitNum,
    offset,
    distinct: true,
  })

  const paginationMeta = buildPaginationMeta(count, pagination)
  return { rows, pagination: paginationMeta }
}

/**
 * Get a single job by ID with full recruiter details.
 */
const getJob = async (jobId) => {
  const job = await Job.findByPk(jobId, {
    include: [{
      model: Recruiter,
      as: 'recruiter',
      attributes: ['company_name', 'industry', 'website', 'company_description'],
    }],
  });
  if (!job) throw createAppError('Job not found.', 404);
  return job;
};

/**
 * Create a new job posting (starts as draft).
 */
const createJob = async (recruiterId, jobData) => {
  // Verify recruiter is approved
  const recruiter = await Recruiter.findOne({ where: { user_id: recruiterId } });
  if (!recruiter) throw createAppError('Recruiter profile not found.', 404);
  if (!recruiter.approved) {
    throw createAppError('Your company account is pending approval by the placement office.', 403);
  }

  const job = await Job.create({
    ...jobData,
    recruiter_id: recruiter.id,
    status: 'draft',
  });

  return job;
};

/**
 * Update a job (recruiter can update their own; placement can update any).
 */
const updateJob = async (jobId, updates, requestingUser) => {
  const job = await Job.findByPk(jobId, {
    include: [{ model: Recruiter, as: 'recruiter' }],
  });
  if (!job) throw createAppError('Job not found.', 404);

  // Ownership check for recruiters
  if (requestingUser.role === 'recruiter') {
    if (job.recruiter.user_id !== requestingUser.userId) {
      throw createAppError('You can only update your own job listings.', 403);
    }
  }

  // Placement officer approval flow
  if (updates.status === 'active' && requestingUser.role === 'placement') {
    updates.approved_by = requestingUser.userId;
  }

  // Store old value for audit middleware
  const oldValue = job.toJSON();

  await job.update(updates);
  return { old: oldValue, updated: await job.reload() };
};

/**
 * Get AI-ranked applicants for a job.
 */
const getApplicants = async (jobId, requestingUser) => {
  const job = await Job.findByPk(jobId, {
    include: [{ model: Recruiter, as: 'recruiter' }],
  });
  if (!job) throw createAppError('Job not found.', 404);

  // Recruiters can only see their own job's applicants
  if (requestingUser.role === 'recruiter') {
    if (job.recruiter.user_id !== requestingUser.userId) {
      throw createAppError('Access denied to this job\'s applicants.', 403);
    }
  }

  const applications = await Application.findAll({
    where: { job_id: jobId },
    include: [{
      model: Student,
      as: 'student',
      attributes: ['id', 'name', 'cgpa', 'branch', 'year_of_study', 'skills',
                   'internships', 'projects', 'certifications', 'resume_url'],
      include: [{ model: User, as: 'user', attributes: ['email'] }],
    }],
    order: [['ai_score', 'DESC']],
  });

  return applications;
};

/**
 * Get jobs posted by a specific recruiter.
 */
const getRecruiterJobs = async (recruiterUserId, filters = {}, pagination = {}) => {
  // recruiterUserId is the User PK; jobs store the Recruiter profile id.
  // Resolve the profile id first so the WHERE clause matches correctly.
  const recruiterProfile = await Recruiter.findOne({ where: { user_id: recruiterUserId } })
  if (!recruiterProfile) throw createAppError('Recruiter profile not found.', 404)

  const where = { recruiter_id: recruiterProfile.id }
  if (filters.status) where.status = filters.status

  const pageNum  = Math.max(1, parseInt(pagination.page  || 1,  10));
  const limitNum = Math.min(100, Math.max(1, parseInt(pagination.limit || 10, 10)));
  const offset   = (pageNum - 1) * limitNum;

  const { count, rows } = await Job.findAndCountAll({
    where,
    include: [
      {
        model: Recruiter,
        as: 'recruiter',
        attributes: ['company_name', 'industry'],
      },
    ],
    attributes: {
      include: [
        [
          require('sequelize').literal(
            `(SELECT COUNT(*) FROM applications WHERE applications.job_id = Job.id)`
          ),
          'applicant_count',
        ],
        [
          require('sequelize').literal(
            `(SELECT COUNT(*) FROM applications WHERE applications.job_id = Job.id AND applications.status = 'shortlisted')`
          ),
          'shortlisted_count',
        ],
      ],
    },
    order:    [['created_at', 'DESC']],
    limit:    limitNum,
    offset,
    distinct: true,
  })

  const paginationMeta = buildPaginationMeta(count, pagination)
  return { rows, pagination: paginationMeta }
}

module.exports = { listJobs, getJob, createJob, updateJob, getApplicants, getRecruiterJobs };