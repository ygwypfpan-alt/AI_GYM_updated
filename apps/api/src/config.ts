import { DEFAULT_BUSINESS_SLUG } from '@ai-gym/shared';

export const config = {
  apiPort: Number(process.env.API_PORT ?? 3001),
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:3000')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  defaultBusinessSlug:
    process.env.DEFAULT_BUSINESS_SLUG ?? DEFAULT_BUSINESS_SLUG,
  adminUsername: process.env.ADMIN_USERNAME ?? 'admin',
  adminPassword: process.env.ADMIN_PASSWORD ?? 'change-me',
  adminJwtSecret:
    process.env.ADMIN_JWT_SECRET ?? 'change-this-to-a-long-random-string',
};
