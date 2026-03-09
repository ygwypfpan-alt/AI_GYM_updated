import { Router } from 'express';

import { asyncHandler, AppError, ok } from '../lib/http.js';
import { getAvailability } from '../services/availability-service.js';

const router: Router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const businessSlug =
      typeof req.query.businessSlug === 'string'
        ? req.query.businessSlug
        : undefined;
    const serviceId =
      typeof req.query.serviceId === 'string' ? req.query.serviceId : undefined;
    const staffId =
      typeof req.query.staffId === 'string' ? req.query.staffId : undefined;
    const fromDate =
      typeof req.query.fromDate === 'string' ? req.query.fromDate : undefined;
    const excludeBookingId =
      typeof req.query.excludeBookingId === 'string'
        ? req.query.excludeBookingId
        : undefined;
    const daysValue =
      typeof req.query.days === 'string' ? Number(req.query.days) : undefined;

    if (!serviceId) {
      throw new AppError('serviceId 為必填。', 400);
    }

    const data = await getAvailability({
      businessSlug,
      serviceId,
      staffId,
      fromDate,
      excludeBookingId,
      days: Number.isFinite(daysValue) ? daysValue : undefined,
    });

    return ok(res, data);
  }),
);

export const availabilityRouter: Router = router;
