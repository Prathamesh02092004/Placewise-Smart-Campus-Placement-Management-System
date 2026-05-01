const router = require('express').Router();
const Joi = require('joi');
const studentController = require('../controllers/student.controller');
const { authenticate } = require('../middleware/auth.middleware');
const rbac = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { uploadResume } = require('../middleware/upload.middleware');
const { auditLog } = require('../middleware/auditLog.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

const updateProfileSchema = {
  body: Joi.object({
    name:          Joi.string().min(2).max(100).optional(),
    phone:         Joi.string().max(15).optional(),
    cgpa:          Joi.number().min(0).max(10).optional(),
    branch:        Joi.string().max(50).optional(),
    year_of_study: Joi.number().integer().min(1).max(4).optional(),
    backlogs:      Joi.number().integer().min(0).optional(),
    internships:   Joi.array().optional(),
    projects:      Joi.array().optional(),
    certifications:Joi.array().optional(),
    skills:        Joi.array().items(Joi.alternatives().try(Joi.string(), Joi.object())).optional(),
  }),
  params: Joi.object({ id: Joi.string().uuid().required() }),
};

const idParamSchema = {
  params: Joi.object({ id: Joi.string().uuid().required() }),
};

// List all students — placement/admin only
router.get('/',
  authenticate,
  authLimiter,
  rbac.require('placement', 'admin'),
  studentController.listStudents
);

// Get a student profile
router.get('/:id',
  authenticate,
  authLimiter,
  validate(idParamSchema),
  rbac.require('student', 'recruiter', 'placement', 'admin'),
  studentController.getProfile
);

// Update own profile
router.put('/:id',
  authenticate,
  authLimiter,
  rbac.require('student'),
  validate(updateProfileSchema),
  studentController.updateProfile,
  auditLog('UPDATE', 'Student')
);

// Upload resume
router.post('/:id/resume',
  authenticate,
  authLimiter,
  rbac.require('student'),
  validate(idParamSchema),
  uploadResume,
  studentController.uploadResume,
  auditLog('UPDATE', 'StudentResume')
);

// Verify a student — placement only
router.patch('/:id/verify',
  authenticate,
  rbac.require('placement', 'admin'),
  validate(idParamSchema),
  studentController.verifyStudent,
  auditLog('UPDATE', 'StudentVerification')
);

module.exports = router;