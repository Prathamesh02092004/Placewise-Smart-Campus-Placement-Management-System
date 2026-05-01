const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const {
  Application, Job, Student, Interview,
  PlacementRecord, Notification, User, Recruiter,
} = require('../models');
const { paginate } = require('../utils/paginate');
const mailer = require('../utils/mailer');
const logger = require('../utils/logger');

const AI_URL    = process.env.AI_SERVICE_URL;
const AI_SECRET = process.env.AI_SERVICE_SECRET;

const createAppError = (msg, code, details = null) => {
  const e = new Error(msg);
  e.statusCode = code;
  if (details) e.details = details;
  return e;
};

//  Transition Table 
// Defines which status each role can move an application to, and from which states.
const TRANSITIONS = {
  recruiter: {
    under_review:        ['applied'],
    shortlisted:         ['applied', 'under_review'],
    interview_scheduled: ['shortlisted'],
    offer_received:      ['interview_scheduled'],
    placed:              ['offer_received'],
    rejected:            ['applied', 'under_review', 'shortlisted', 'interview_scheduled', 'offer_received'],
  },
  placement: {
    under_review:        ['applied'],
    shortlisted:         ['applied', 'under_review'],
    interview_scheduled: ['shortlisted'],
    offer_received:      ['interview_scheduled'],
    placed:              ['offer_received'],
    rejected:            ['applied', 'under_review', 'shortlisted',
                          'interview_scheduled', 'offer_received'],
  },
  admin: {
    // Admin can perform any transition including rollbacks
    applied:             ['under_review', 'shortlisted'],
    under_review:        ['applied', 'shortlisted'],
    shortlisted:         ['applied', 'under_review', 'interview_scheduled'],
    interview_scheduled: ['shortlisted', 'offer_received'],
    offer_received:      ['interview_scheduled', 'placed'],
    placed:              ['offer_received'],
    rejected:            ['applied', 'under_review', 'shortlisted',
                          'interview_scheduled', 'offer_received'],
  },
};

const validateTransition = (currentStatus, newStatus, role) => {
  const allowed = TRANSITIONS[role]?.[newStatus] || [];
  if (!allowed.includes(currentStatus)) {
    throw createAppError(
      `Invalid status transition: cannot move from '${currentStatus}' to '${newStatus}' as ${role}.`,
      409
    );
  }
};

// Notification Helper
const notifyStudent = async (userId, type, title, message, metadata = {}) => {
  try {
    await Notification.create({
      id: uuidv4(),
      user_id: userId,
      type,
      title,
      message,
      metadata,
    });
  } catch (err) {
    logger.warn('Notification create failed:', err.message);
  }
};

// Service Methods

/**
 * Submit a new application.
 * Enforces eligibility, prevents duplicates, triggers AI scoring.
 */
const apply = async (studentUserId, jobId) => {
  // Get student profile
  const student = await Student.findOne({ where: { user_id: studentUserId } });
  if (!student) throw createAppError('Student profile not found.', 404);
  if (!student.is_verified) {
    throw createAppError('Your profile must be verified by the placement office before applying.', 403);
  }
  if (!student.profile_complete) {
    throw createAppError('Please complete your profile before applying to jobs.', 400);
  }

  // Get job
  const job = await Job.findByPk(jobId, {
    include: [{ model: Recruiter, as: 'recruiter' }],
  });
  if (!job) throw createAppError('Job not found.', 404);
  if (job.status !== 'active') throw createAppError('This job listing is no longer accepting applications.', 400);

  // Check deadline
  if (job.deadline && new Date() > new Date(job.deadline)) {
    throw createAppError('The application deadline for this job has passed.', 400);
  }

  // Eligibility checks
  const eligibilityErrors = [];
  if (job.min_cgpa && student.cgpa < job.min_cgpa) {
    eligibilityErrors.push(`Minimum CGPA required: ${job.min_cgpa}. Your CGPA: ${student.cgpa}.`);
  }
  if (job.eligible_branches?.length > 0 && !job.eligible_branches.includes(student.branch)) {
    eligibilityErrors.push(`Your branch (${student.branch}) is not eligible for this position.`);
  }
  if (job.year_of_study && student.year_of_study !== job.year_of_study) {
    eligibilityErrors.push(`This job is for year ${job.year_of_study} students only.`);
  }
  if (eligibilityErrors.length > 0) {
    throw createAppError('Eligibility check failed.', 403, eligibilityErrors);
  }

  // Duplicate check
  const existing = await Application.findOne({
    where: { student_id: student.id, job_id: jobId },
  });
  if (existing) throw createAppError('You have already applied for this position.', 409);

  // Create application
  const application = await Application.create({
    id: uuidv4(),
    student_id: student.id,
    job_id: jobId,
    status: 'applied',
    resume_url: student.resume_url,
    applied_at: new Date(),
  });

  // Trigger AI scoring asynchronously 
  scoreApplicationAsync(application.id, student, job);

  // Notify student
  await notifyStudent(
    studentUserId,
    'application_status',
    'Application Submitted',
    `Your application for ${job.title} at ${job.recruiter.company_name} has been received.`,
    { applicationId: application.id, jobId, jobTitle: job.title }
  );

  // Send confirmation email (non-blocking)
  const user = await User.findByPk(studentUserId, { attributes: ['email'] });
  mailer.sendApplicationConfirmation(user.email, student.name, job.title, job.recruiter.company_name)
    .catch((err) => logger.warn('Application email failed:', err.message));

  return application;
};

/**
 * Fire-and-forget AI scoring. Updates ai_score on the application record.
 */
const scoreApplicationAsync = async (applicationId, student, job) => {
  try {
    const skillNames = (student.skills || []).map((s) =>
      typeof s === 'string' ? s : s.skill_name
    );

    const response = await axios.post(`${AI_URL}/ai/resume/score`, {
      student_profile: {
        skills: skillNames,
        cgpa: student.cgpa,
        branch: student.branch,
        internships: student.internships,
        projects: student.projects,
      },
      job_requirements: {
        required_skills: job.required_skills,
        min_cgpa: job.min_cgpa,
        role_category: job.role_category,
        description: job.description,
      },
    }, {
      headers: { 'x-api-secret': AI_SECRET },
      timeout: 30000,
    });

    const score = response.data?.score ?? null;
    if (score !== null) {
      await Application.update({ ai_score: score }, { where: { id: applicationId } });
      logger.info(`AI score updated for application ${applicationId}: ${score}`);
    }
  } catch (err) {
    logger.warn(`AI scoring failed for application ${applicationId}:`, err.message);
  }
};

/**
 * Get a student's own applications.
 */
const getMyApplications = async (studentUserId, pagination) => {
  const student = await Student.findOne({ where: { user_id: studentUserId } });
  if (!student) throw createAppError('Student profile not found.', 404);

  return paginate(Application, {
    where: { student_id: student.id },
    include: [
      {
        model: Job,
        as: 'job',
        attributes: ['id', 'title', 'role_category', 'location', 'package_lpa'],
        include: [{
          model: Recruiter,
          as: 'recruiter',
          attributes: ['company_name'],
        }],
      },
      { model: Interview, as: 'interview' },
    ],
    order: [['applied_at', 'DESC']],
  }, pagination);
};

/**
 * Get a single application by ID.
 */
const getApplication = async (applicationId, requestingUser) => {
  const application = await Application.findByPk(applicationId, {
    include: [
      { model: Job, as: 'job', include: [{ model: Recruiter, as: 'recruiter' }] },
      { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['email'] }] },
      { model: Interview, as: 'interview' },
      { model: PlacementRecord, as: 'placementRecord' },
    ],
  });
  if (!application) throw createAppError('Application not found.', 404);

  // Students can only see their own
  if (requestingUser.role === 'student') {
    const student = await Student.findOne({ where: { user_id: requestingUser.userId } });
    if (application.student_id !== student?.id) {
      throw createAppError('Access denied.', 403);
    }
  }

  return application;
};

/**
 * Advance application status through the transition table.
 */
const updateStatus = async (applicationId, newStatus, requestingUser) => {
  const application = await Application.findByPk(applicationId, {
    include: [
      { model: Job, as: 'job', include: [{ model: Recruiter, as: 'recruiter' }] },
      { model: Student, as: 'student', include: [{ model: User, as: 'user', attributes: ['email'] }] },
    ],
  });
  if (!application) throw createAppError('Application not found.', 404);

  // Recruiter ownership check
  if (requestingUser.role === 'recruiter') {
    if (application.job.recruiter.user_id !== requestingUser.userId) {
      throw createAppError('You can only manage applications for your own jobs.', 403);
    }
  }

  validateTransition(application.status, newStatus, requestingUser.role);

  const oldStatus = application.status;
  await application.update({ status: newStatus });

  // Side effects by status
  const job   = application.job;
  const student = application.student;
  const studentUser = student.user;

  if (newStatus === 'shortlisted') {
    await notifyStudent(studentUser.id, 'application_status',
      'You have been shortlisted!',
      `Congratulations! You have been shortlisted for ${job.title} at ${job.recruiter.company_name}.`,
      { applicationId, jobTitle: job.title, status: newStatus }
    );
    mailer.sendShortlistNotification(studentUser.email, student.name, job.title, job.recruiter.company_name)
      .catch(() => {});
  }

  if (newStatus === 'offer_received') {
    await notifyStudent(studentUser.id, 'offer_received',
      'Offer Letter Received!',
      `You have received an offer for ${job.title} at ${job.recruiter.company_name}. Log in to view it.`,
      { applicationId, jobTitle: job.title }
    );
    mailer.sendOfferNotification(studentUser.email, student.name, job.title, job.recruiter.company_name)
      .catch(() => {});
  }

  if (newStatus === 'placed') {
    // Auto-create placement record
    await PlacementRecord.create({
      id: uuidv4(),
      student_id: student.id,
      job_id: job.id,
      application_id: applicationId,
      package_lpa: job.package_lpa,
      confirmed_by: requestingUser.userId,
    });

    await notifyStudent(studentUser.id, 'application_status',
      '🎉 Placement Confirmed!',
      `Your placement at ${job.recruiter.company_name} has been confirmed by the placement office.`,
      { applicationId, jobTitle: job.title }
    );
  }

  if (newStatus === 'rejected') {
    await notifyStudent(studentUser.id, 'application_status',
      'Application Update',
      `Your application for ${job.title} at ${job.recruiter.company_name} was not selected at this time.`,
      { applicationId, jobTitle: job.title, status: newStatus }
    );
  }

  return application.reload();
};

/**
 * Upload an offer letter PDF and link it to a placement record.
 */
const uploadOfferLetter = async (applicationId, fileBuffer, filename, recruiterUserId) => {
  const application = await Application.findByPk(applicationId, {
    include: [
      { model: Job, as: 'job', include: [{ model: Recruiter, as: 'recruiter' }] },
      { model: PlacementRecord, as: 'placementRecord' },
    ],
  });
  if (!application) throw createAppError('Application not found.', 404);
  if (application.job.recruiter.user_id !== recruiterUserId) {
    throw createAppError('Access denied.', 403);
  }
  if (application.status !== 'offer_received' && application.status !== 'placed') {
    throw createAppError('Offer letters can only be uploaded for applications in offer_received or placed status.', 400);
  }

  const { uploadFile } = require('../config/storage');
  const fileUrl = await uploadFile(fileBuffer, filename);

  if (application.placementRecord) {
    await application.placementRecord.update({ offer_letter_url: fileUrl });
  }

  return { offer_letter_url: fileUrl };
};

module.exports = {
  apply,
  getMyApplications,
  getApplication,
  updateStatus,
  uploadOfferLetter,
};