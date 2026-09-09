import * as Joi from 'joi';
import { assertProductionConfig } from '../common/utils/production-config.util';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(3000),
  DATABASE_URL: Joi.string().required(),
  JWT_SECRET: Joi.string().min(16).required(),
  JWT_EXPIRES_IN: Joi.string().default('7d'),
  OTP_DEBUG: Joi.boolean().truthy('true').falsy('false').default(false),
  DEV_LOGIN_ENABLED: Joi.boolean().truthy('true').falsy('false').default(false),
  OTP_AUTH_ENABLED: Joi.boolean().truthy('true').falsy('false').default(true),
  GOOGLE_AUTH_ENABLED: Joi.boolean().truthy('true').falsy('false').default(false),
  GOOGLE_CLIENT_ID_ANDROID: Joi.string().allow('').default(''),
  GOOGLE_CLIENT_ID_IOS: Joi.string().allow('').default(''),
  GOOGLE_CLIENT_ID_WEB: Joi.string().allow('').default(''),
  GOOGLE_AUTH_IP_LIMIT: Joi.number().integer().min(1).default(20),
  GOOGLE_AUTH_IP_WINDOW_SECONDS: Joi.number().integer().min(60).default(900),
  APPLE_AUTH_ENABLED: Joi.boolean().truthy('true').falsy('false').default(false),
  APPLE_CLIENT_ID_IOS: Joi.string().allow('').default(''),
  APPLE_CLIENT_ID_WEB: Joi.string().allow('').default(''),
  SOCIAL_AUTH_IP_LIMIT: Joi.number().integer().min(1).default(20),
  SOCIAL_AUTH_IP_WINDOW_SECONDS: Joi.number().integer().min(60).default(900),
  MOCK_PLAN_CHECKOUT_ENABLED: Joi.boolean().truthy('true').falsy('false').default(false),
  OTP_SEND_COOLDOWN_SECONDS: Joi.number().integer().min(30).default(60),
  OTP_SEND_PHONE_LIMIT: Joi.number().integer().min(1).default(5),
  OTP_SEND_PHONE_WINDOW_SECONDS: Joi.number().integer().min(60).default(3600),
  OTP_SEND_IP_LIMIT: Joi.number().integer().min(1).default(20),
  OTP_SEND_IP_WINDOW_SECONDS: Joi.number().integer().min(60).default(3600),
  OTP_VERIFY_MAX_ATTEMPTS: Joi.number().integer().min(1).default(5),
  OTP_VERIFY_WINDOW_SECONDS: Joi.number().integer().min(60).default(900),
  ANALYTICS_EVENTS_IP_LIMIT: Joi.number().integer().min(10).default(300),
  ANALYTICS_EVENTS_WINDOW_SECONDS: Joi.number().integer().min(10).default(60),
  DEFAULT_CITY_SLUG: Joi.string().default('uralsk'),
  CORS_ORIGINS: Joi.string().allow('').default(''),
  UPLOAD_DIR: Joi.string().default('./uploads'),
  MAX_UPLOAD_MB: Joi.number().default(5),
  AI_ORCHESTRATOR_URL: Joi.string().uri().default('http://localhost:3004'),
  QALAGO_INTERNAL_SERVICE_TOKEN: Joi.string().allow('').default(''),
  BUSINESS_APPLICATION_CREATE_LIMIT: Joi.number().integer().min(1).default(5),
  BUSINESS_APPLICATION_CREATE_WINDOW_SECONDS: Joi.number().integer().min(1).default(3600),
  BUSINESS_APPLICATION_SUBMIT_LIMIT: Joi.number().integer().min(1).default(10),
  BUSINESS_APPLICATION_SUBMIT_WINDOW_SECONDS: Joi.number().integer().min(1).default(3600),
  OWNERSHIP_CLAIM_CREATE_LIMIT: Joi.number().integer().min(1).default(5),
  OWNERSHIP_CLAIM_CREATE_WINDOW_SECONDS: Joi.number().integer().min(1).default(3600),
}).custom((value, helpers) => {
  try {
    assertProductionConfig({
      nodeEnv: value.NODE_ENV,
      jwtSecret: value.JWT_SECRET,
      corsOrigins: value.CORS_ORIGINS ?? '',
      otpDebug: value.OTP_DEBUG === true,
      devLoginEnabled: value.DEV_LOGIN_ENABLED === true,
      mockPlanCheckoutEnabled: value.MOCK_PLAN_CHECKOUT_ENABLED === true,
      googleAuthEnabled: value.GOOGLE_AUTH_ENABLED === true,
      googleClientIdAndroid: value.GOOGLE_CLIENT_ID_ANDROID ?? '',
      googleClientIdIos: value.GOOGLE_CLIENT_ID_IOS ?? '',
      googleClientIdWeb: value.GOOGLE_CLIENT_ID_WEB ?? '',
      appleAuthEnabled: value.APPLE_AUTH_ENABLED === true,
      appleClientIdIos: value.APPLE_CLIENT_ID_IOS ?? '',
      appleClientIdWeb: value.APPLE_CLIENT_ID_WEB ?? '',
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid production configuration';
    return helpers.error('any.custom', { message });
  }
  return value;
});
