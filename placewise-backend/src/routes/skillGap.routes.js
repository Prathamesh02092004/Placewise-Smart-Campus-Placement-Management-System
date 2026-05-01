const router = require('express').Router();
const Joi = require('joi');
const skillGapController = require('../controllers/skillGap.controller');
const { authenticate } = require('../middleware/auth.middleware');
const rbac = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

const jobIdSchema = { params: Joi.object({ jobId: Joi.string().uuid().required() }) };
const roleCatSchema = { params: Joi.object({ roleCategory: Joi.string().required() }) };

// Analyze gap for student viewing a job
router.get('/:jobId',
  authenticate, authLimiter,
  rbac.require('student'),
  validate(jobIdSchema),
  skillGapController.analyzeGap
);

// Get learning path for a gap
router.get('/:jobId/learning-path',
  authenticate, authLimiter,
  rbac.require('student'),
  validate(jobIdSchema),
  skillGapController.getLearningPath
);

// Market demand trends by role category
router.get('/trends/:roleCategory',
  authenticate, authLimiter,
  validate(roleCatSchema),
  skillGapController.getMarketTrends
);

// Batch analysis — placement only
router.post('/batch/:jobId',
  authenticate, authLimiter,
  rbac.require('placement', 'admin'),
  skillGapController.batchAnalyze
);

module.exports = router;