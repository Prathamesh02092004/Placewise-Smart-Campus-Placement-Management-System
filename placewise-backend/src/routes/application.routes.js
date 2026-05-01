const router = require('express').Router();
const Joi = require('joi');
const applicationController = require('../controllers/application.controller');
const { authenticate } = require('../middleware/auth.middleware');
const rbac = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { auditLog } = require('../middleware/auditLog.middleware');
const { uploadOfferLetter } = require('../middleware/upload.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

const applySchema = {
  body: Joi.object({ job_id: Joi.string().uuid().required() }),
};

const statusSchema = {
  params: Joi.object({ id: Joi.string().uuid().required() }),
  body: Joi.object({
    status: Joi.string()
      .valid('under_review', 'shortlisted', 'interview_scheduled',
             'offer_received', 'placed', 'rejected')
      .required(),
  }),
};

const idSchema = {
  params: Joi.object({ id: Joi.string().uuid().required() }),
};

// Submit application — student only
router.post('/',
  authenticate,
  authLimiter,
  rbac.require('student'),
  validate(applySchema),
  applicationController.apply,
  auditLog('CREATE', 'Application')
);

// Get own applications — student only
router.get('/my',
  authenticate,
  authLimiter,
  rbac.require('student'),
  applicationController.getMyApplications
);

// Get single application
router.get('/:id',
  authenticate,
  authLimiter,
  validate(idSchema),
  rbac.require('student', 'recruiter', 'placement', 'admin'),
  applicationController.getApplication
);

// Advance application status
router.put('/:id/status',
  authenticate,
  authLimiter,
  rbac.require('recruiter', 'placement', 'admin'),
  validate(statusSchema),
  applicationController.updateStatus,
  auditLog('STATUS_CHANGE', 'Application')
);

// Upload offer letter
router.post('/:id/offer-letter',
  authenticate,
  authLimiter,
  rbac.require('recruiter'),
  validate(idSchema),
  uploadOfferLetter,
  applicationController.uploadOfferLetter,
  auditLog('UPDATE', 'OfferLetter')
);

module.exports = router;