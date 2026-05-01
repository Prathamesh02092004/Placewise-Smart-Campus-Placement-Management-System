const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const Joi = require('joi');

const envSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5000),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(3306),
  DB_NAME: Joi.string().required(),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().allow('').required(),

  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.number().default(900),
  REFRESH_TOKEN_EXPIRES_DAYS: Joi.number().default(7),

  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().default(587),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  SMTP_FROM: Joi.string().default('PlaceWise <noreply@placewise.com>'),

  LOCAL_UPLOAD_DIR: Joi.string().default('uploads/'),

  AI_SERVICE_URL: Joi.string().uri().required(),
  AI_SERVICE_SECRET: Joi.string().required(),

  FRONTEND_URL: Joi.string().uri().required(),

  RATE_LIMIT_WINDOW_MS: Joi.number().default(900000),
  RATE_LIMIT_MAX_PUBLIC: Joi.number().default(100),
  RATE_LIMIT_MAX_AUTH: Joi.number().default(500),
})
  .unknown(true)
  .required();

const { error, value: envVars } = envSchema.validate(process.env);
if (error) throw new Error(`Environment configuration error: ${error.message}`);

module.exports = envVars;