const router = require('express').Router();
const Joi = require('joi');
const adminController = require('../controllers/admin.controller');
const { authenticate } = require('../middleware/auth.middleware');
const rbac = require('../middleware/rbac.middleware');
const { validate } = require('../middleware/validate.middleware');
const { auditLog } = require('../middleware/auditLog.middleware');
const { authLimiter } = require('../middleware/rateLimit.middleware');

const {
  listUsers,
  setUserActive,
  getAuditLogs,
  upsertSkill,
  deleteSkill,
  getSkillTaxonomy,
} = adminController;

const required = { listUsers, setUserActive, getAuditLogs, upsertSkill, deleteSkill, getSkillTaxonomy };
Object.entries(required).forEach(([name, fn]) => {
  if (typeof fn !== 'function') {
    throw new Error(`admin.controller is missing export: "${name}"`);
  }
});

const skillSchema = {
  body: Joi.object({
    skill_name:    Joi.string().max(100).required(),
    category:      Joi.string()
                     .valid('Frontend', 'Backend', 'AI/ML', 'DevOps', 'Domain', 'Soft Skills')
                     .required(),
    role_tags:     Joi.array().items(Joi.string()).default([]),
    market_demand: Joi.number().min(0).max(100).default(0),
    demand_trend:  Joi.string().valid('rising', 'stable', 'declining').default('stable'),
    learning_urls: Joi.array().default([]),
    aliases:       Joi.array().items(Joi.string()).default([]),
  }),
};

router.get('/users',
  authenticate,
  authLimiter,
  rbac.require('admin'),
  listUsers
);

router.patch('/users/:id/status',
  authenticate,
  authLimiter,
  rbac.require('admin'),
  validate({
    params: Joi.object({ id: Joi.string().uuid().required() }),
    body:   Joi.object({ is_active: Joi.boolean().required() }),
  }),
  setUserActive,
  auditLog('UPDATE', 'UserStatus')
);

router.get('/audit-logs',
  authenticate,
  authLimiter,
  rbac.require('admin'),
  getAuditLogs
);

router.get('/skill-taxonomy',
  authenticate,
  authLimiter,
  rbac.require('admin', 'placement'),
  getSkillTaxonomy
);

router.post('/skill-taxonomy',
  authenticate,
  authLimiter,
  rbac.require('admin'),
  validate(skillSchema),
  upsertSkill,
  auditLog('CREATE', 'SkillTaxonomy')
);

router.delete('/skill-taxonomy/:id',
  authenticate,
  authLimiter,
  rbac.require('admin'),
  validate({ params: Joi.object({ id: Joi.string().uuid().required() }) }),
  deleteSkill,
  auditLog('DELETE', 'SkillTaxonomy')
);

module.exports = router;