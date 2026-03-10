import { Router } from 'express';

import { config } from '../config.js';
import { createAdminToken } from '../lib/auth.js';
import { asyncHandler, ok } from '../lib/http.js';
import { requireAdminAuth } from '../middleware/admin-auth.js';
import { getAdminDashboard } from '../services/dashboard-service.js';

const router: Router = Router();

router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { username, password } = req.body ?? {};

    if (
      username !== config.adminUsername ||
      password !== config.adminPassword
    ) {
      return res.status(401).json({
        success: false,
        error: 'Invalid admin credentials.',
      });
    }

    const token = createAdminToken({
      username: config.adminUsername,
      secret: config.adminJwtSecret,
    });

    return ok(res, { token });
  }),
);

router.use(requireAdminAuth);

router.get(
  '/me',
  asyncHandler(async (_req, res) => {
    return ok(res, {
      username: String(res.locals.adminUsername),
    });
  }),
);

router.get(
  '/dashboard',
  asyncHandler(async (req, res) => {
    const businessSlug =
      typeof req.query.businessSlug === 'string'
        ? req.query.businessSlug
        : undefined;

    const dashboard = await getAdminDashboard(businessSlug);
    return ok(res, dashboard);
  }),
);

export const adminRouter: Router = router;
