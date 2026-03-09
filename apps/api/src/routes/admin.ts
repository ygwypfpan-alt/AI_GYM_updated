import { Router } from 'express';

import { asyncHandler, ok } from '../lib/http.js';
import { getAdminDashboard } from '../services/dashboard-service.js';

const router: Router = Router();

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
