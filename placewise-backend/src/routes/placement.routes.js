const router = require('express').Router();
const Joi = require('joi');
const placementController = require('../controllers/placement.controller');
const { authenticate } = require('../middleware/auth.middleware');
const rbac = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { auditLog } = require('../middleware/auditLog.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');
const { Job } = require('../models');
const { success } = require('../utils/response');

const { getStats, getRecords, getPendingCompanies, approveCompany } = placementController;
if (!getStats || !getRecords || !getPendingCompanies || !approveCompany) {
  throw new Error(
    'placement.controller is missing exports: ' +
    JSON.stringify({
      getStats: !!getStats,
      getRecords: !!getRecords,
      getPendingCompanies: !!getPendingCompanies,
      approveCompany: !!approveCompany,
    })
  );
}

router.get('/stats',
  authenticate,
  authLimiter,
  rbac.require('placement', 'admin'),
  getStats
);

router.get('/records',
  authenticate,
  authLimiter,
  rbac.require('placement', 'admin'),
  getRecords
);

router.get('/companies/pending',
  authenticate,
  authLimiter,
  rbac.require('placement', 'admin'),
  getPendingCompanies
);

router.patch('/companies/:recruiterId/approve',
  authenticate,
  authLimiter,
  rbac.require('placement', 'admin'),
  validate({
    params: Joi.object({ recruiterId: Joi.string().uuid().required() }),
  }),
  approveCompany,
  auditLog('UPDATE', 'CompanyApproval')
);

router.patch('/jobs/:jobId/approve',
  authenticate,
  authLimiter,
  rbac.require('placement', 'admin'),
  validate({ params: Joi.object({ jobId: Joi.string().uuid().required() }) }),
  async (req, res, next) => {
    try {
      const job = await Job.findByPk(req.params.jobId);
      if (!job) return res.status(404).json({ success: false, message: 'Job not found.' });
      await job.update({ status: 'active', approved_by: req.user.userId });
      return success(res, 200, 'Job approved and is now active.', job);
    } catch (err) { next(err); }
  },
  require('../middleware/auditLog.middleware').auditLog('UPDATE', 'JobApproval')
);

router.patch('/jobs/:jobId/approve',
  authenticate,
  authLimiter,
  rbac.require('placement', 'admin'),
  validate({ params: Joi.object({ jobId: Joi.string().uuid().required() }) }),
  async (req, res, next) => {
    try {
      const { Job } = require('../models')
      const { success } = require('../utils/response')
      const job = await Job.findByPk(req.params.jobId)
      if (!job) return res.status(404).json({ success: false, message: 'Job not found.' })
      await job.update({ status: 'active', approved_by: req.user.userId })
      return success(res, 200, 'Job approved and is now visible to students.', job)
    } catch (err) { next(err) }
  }
)

module.exports = router;