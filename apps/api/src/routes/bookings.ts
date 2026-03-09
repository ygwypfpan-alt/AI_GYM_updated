import { Router } from 'express';

import { asyncHandler, AppError, ok } from '../lib/http.js';
import {
  cancelBooking,
  createBooking,
  rescheduleBooking,
} from '../services/booking-service.js';

const router: Router = Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const {
      businessSlug,
      serviceId,
      staffId,
      slotStartAt,
      customer,
      notes,
      conversationId,
    } = req.body ?? {};

    if (typeof serviceId !== 'string' || typeof slotStartAt !== 'string') {
      throw new AppError('serviceId 與 slotStartAt 為必填。', 400);
    }

    const booking = await createBooking({
      businessSlug: typeof businessSlug === 'string' ? businessSlug : undefined,
      serviceId,
      staffId: typeof staffId === 'string' ? staffId : undefined,
      slotStartAt,
      customer,
      notes: typeof notes === 'string' ? notes : undefined,
      conversationId:
        typeof conversationId === 'string' ? conversationId : undefined,
    });

    return ok(
      res,
      {
        booking,
        message: '預約建立成功。',
      },
      201,
    );
  }),
);

router.patch(
  '/:bookingId/reschedule',
  asyncHandler(async (req, res) => {
    const bookingId = req.params.bookingId;
    const { slotStartAt, staffId } = req.body ?? {};

    if (typeof bookingId !== 'string' || typeof slotStartAt !== 'string') {
      throw new AppError('slotStartAt 為必填。', 400);
    }

    const booking = await rescheduleBooking({
      bookingId,
      slotStartAt,
      staffId: typeof staffId === 'string' ? staffId : undefined,
    });

    return ok(res, {
      booking,
      message: '改期成功。',
    });
  }),
);

router.patch(
  '/:bookingId/cancel',
  asyncHandler(async (req, res) => {
    const bookingId = req.params.bookingId;
    const { reason } = req.body ?? {};

    if (typeof bookingId !== 'string') {
      throw new AppError('bookingId is required.', 400);
    }

    const booking = await cancelBooking({
      bookingId,
      reason: typeof reason === 'string' ? reason : undefined,
    });

    return ok(res, {
      booking,
      message: '預約已取消。',
    });
  }),
);

export const bookingsRouter: Router = router;
