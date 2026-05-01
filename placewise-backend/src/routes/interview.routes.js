const router = require('express').Router();
const Joi = require('joi');
const interviewController = require('../controllers/interview.controller');
const { authenticate } = require('../middleware/auth.middleware');
const rbac = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { auditLog } = require('../middleware/auditLog.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

const scheduleSchema = {
  body: Joi.object({
    application_id:   Joi.string().uuid().required(),
    scheduled_at:     Joi.date().iso().greater('now').required(),
    mode:             Joi.string().valid('online', 'offline').required(),
    video_link:       Joi.string().uri().when('mode', { is: 'online', then: Joi.required() }),
    venue:            Joi.string().max(300).when('mode', { is: 'offline', then: Joi.required() }),
    duration_minutes: Joi.number().integer().min(15).max(480).default(60),
    round:            Joi.number().integer().min(1).default(1),
  }),
};

const updateSchema = {
  params: Joi.object({ id: Joi.string().uuid().required() }),
  body: Joi.object({
    scheduled_at:     Joi.date().iso().optional(),
    mode:             Joi.string().valid('online', 'offline').optional(),
    video_link:       Joi.string().uri().optional(),
    venue:            Joi.string().max(300).optional(),
    duration_minutes: Joi.number().integer().optional(),
    result:           Joi.string().valid('pending', 'selected', 'rejected', 'no_show').optional(),
    feedback:         Joi.string().max(2000).optional(),
  }),
};

router.post('/',
  authenticate, authLimiter,
  rbac.require('recruiter'),
  validate(scheduleSchema),
  interviewController.scheduleInterview,
  auditLog('CREATE', 'Interview')
);

router.put('/:id',
  authenticate, authLimiter,
  rbac.require('recruiter'),
  validate(updateSchema),
  interviewController.updateInterview,
  auditLog('UPDATE', 'Interview')
);

router.get('/application/:applicationId',
  authenticate, authLimiter,
  rbac.require('student', 'recruiter', 'placement', 'admin'),
  interviewController.getInterview
);

module.exports = router;