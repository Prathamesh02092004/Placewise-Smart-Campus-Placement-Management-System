const router = require('express').Router();
const Joi = require('joi');
const authController = require('../controllers/auth.controller');
const { authenticate } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validate.middleware');
const { loginLimiter } = require('../middleware/rateLimit.middleware');

const registerSchema = {
  body: Joi.object({
    role:          Joi.string().valid('student', 'recruiter', 'placement').required(),
    name:          Joi.string().min(2).max(100).required(),
    email:         Joi.string().email().required(),
    password:      Joi.string().min(8).required(),
    // Student optional
    branch:        Joi.string().max(50).optional().allow(''),
    year_of_study: Joi.number().integer().min(1).max(4).optional().allow('', null),
    cgpa:          Joi.number().min(0).max(10).optional().allow('', null),
    backlogs:      Joi.number().integer().min(0).optional().allow('', null),
    // Recruiter optional
    company_name:  Joi.string().max(150).optional().allow(''),
    designation:   Joi.string().max(100).optional().allow(''),
    phone:         Joi.string().max(15).optional().allow(''),
    // Placement optional
    department:    Joi.string().max(100).optional().allow(''),
  }),
}

const loginSchema = {
  body: Joi.object({
    email:    Joi.string().email().required(),
    password: Joi.string().required(),
  }),
};

const forgotSchema = {
  body: Joi.object({
    email: Joi.string().email().required(),
  }),
};

const resetSchema = {
  body: Joi.object({
    token:    Joi.string().required(),
    password: Joi.string().min(8).required(),
  }),
};

router.post('/register',        validate(registerSchema), authController.register);
router.post('/login',           loginLimiter, validate(loginSchema), authController.login);
router.post('/refresh',         authController.refresh);
router.post('/logout',          authenticate, authController.logout);
router.get('/verify-email',     authController.verifyEmail);
router.post('/forgot-password', validate(forgotSchema), authController.forgotPassword);
router.post('/reset-password',  validate(resetSchema), authController.resetPassword);
router.get('/me',               authenticate, authController.getMe);

module.exports = router;