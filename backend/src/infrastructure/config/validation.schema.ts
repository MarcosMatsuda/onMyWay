import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().required().messages({
    'any.required': 'DATABASE_URL is required (postgres connection string)',
  }),
  JWT_SECRET: Joi.string().min(32).required().messages({
    'any.required': 'JWT_SECRET is required',
    'string.min':
      'JWT_SECRET must be at least 32 characters (for security, use a strong random string)',
  }),
  OSRM_BASE_URL: Joi.string().uri().required().messages({
    'any.required': 'OSRM_BASE_URL is required (e.g., http://osrm:5000)',
    'string.uri': 'OSRM_BASE_URL must be a valid URI',
  }),
  ALLOWED_ORIGINS: Joi.string()
    .default('http://localhost:3000,http://localhost:5000')
    .messages({
      'string.base':
        'ALLOWED_ORIGINS must be comma-separated list of origins (e.g., http://localhost:3000,https://example.com)',
    }),
});
