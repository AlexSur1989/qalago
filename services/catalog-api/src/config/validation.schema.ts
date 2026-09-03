import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  OTP_DEBUG: Joi.boolean().truthy('true').falsy('false').default(false),
  DEFAULT_CITY_SLUG: Joi.string().default('uralsk'),
  CORS_ORIGINS: Joi.string().allow('').default(''),
  UPLOAD_DIR: Joi.string().default('./uploads'),
  MAX_UPLOAD_MB: Joi.number().default(5),
});
