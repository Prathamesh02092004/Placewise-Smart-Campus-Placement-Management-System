const router = require('express').Router();
const Joi = require('joi');
const jobController = require('../controllers/job.controller');
const { authenticate } = require('../middleware/auth.middleware');
const rbac = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { auditLog } = require('../middleware/auditLog.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

const createJobSchema = {
  body: Joi.object({
    title:            Joi.string().min(3).max(200).required(),
    description:      Joi.string().min(20).required(),
    required_skills:  Joi.array().items(Joi.string()).min(1).required(),
    min_cgpa:         Joi.number().min(0).max(10).default(0),
    eligible_branches:Joi.array().items(Joi.string()).default([]),
    year_of_study:    Joi.number().integer().min(1).max(4).allow(null).optional(),
    role_category:    Joi.string().max(80).optional(),
    location:         Joi.string().max(150).optional(),
    package_lpa:      Joi.number().min(0).optional(),
    deadline:         Joi.date().iso().greater('now').optional(),
    slots:            Joi.number().integer().min(1).default(1),
  }),
};

const updateJobSchema = {
  params: Joi.object({ id: Joi.string().uuid().required() }),
  body: Joi.object({
    title:            Joi.string().min(3).max(200).optional(),
    description:      Joi.string().min(20).optional(),
    required_skills:  Joi.array().items(Joi.string()).optional(),
    min_cgpa:         Joi.number().min(0).max(10).optional(),
    eligible_branches:Joi.array().items(Joi.string()).optional(),
    role_category:    Joi.string().max(80).optional(),
    location:         Joi.string().max(150).optional(),
    package_lpa:      Joi.number().min(0).optional(),
    deadline:         Joi.date().iso().optional(),
    slots:            Joi.number().integer().min(1).optional(),
    status:           Joi.string().valid('draft', 'active', 'closed').optional(),
  }),
};

const idParamSchema = {
  params: Joi.object({ id: Joi.string().uuid().required() }),
};

// Get all active jobs — any authenticated user
router.get('/',
  authenticate,
  authLimiter,
  jobController.listJobs
);

// Get recruiter's own jobs
router.get('/my-jobs',
  authenticate,
  authLimiter,
  rbac.require('recruiter'),
  jobController.getMyJobs
);

// Get a single job
router.get('/:id',
  authenticate,
  authLimiter,
  validate(idParamSchema),
  jobController.getJob
);

// Create a job — recruiter only
router.post('/',
  authenticate,
  authLimiter,
  rbac.require('recruiter'),
  validate(createJobSchema),
  jobController.createJob,
  auditLog('CREATE', 'Job')
);

// Update a job — recruiter (own) or placement
router.put('/:id',
  authenticate,
  authLimiter,
  rbac.require('recruiter', 'placement', 'admin'),
  validate(updateJobSchema),
  jobController.updateJob,
  auditLog('UPDATE', 'Job')
);

// Get AI-ranked applicants — recruiter (own) or placement/admin
router.get('/:id/applicants',
  authenticate,
  authLimiter,
  rbac.require('recruiter', 'placement', 'admin'),
  validate(idParamSchema),
  jobController.getApplicants
);

module.exports = router;