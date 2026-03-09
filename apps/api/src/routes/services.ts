import { Router } from 'express';

import { asyncHandler, ok } from '../lib/http.js';
import { listActiveServices } from '../services/service-service.js';

const router: Router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const businessSlug =
      typeof req.query.businessSlug === 'string'
        ? req.query.businessSlug
        : undefined;

    const services = await listActiveServices(businessSlug);
    return ok(res, { services });
  }),
);

export const servicesRouter: Router = router;
