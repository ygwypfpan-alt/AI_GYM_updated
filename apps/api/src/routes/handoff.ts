import { Router } from 'express';

import { asyncHandler, ok } from '../lib/http.js';
import { createHandoffRequest } from '../services/handoff-service.js';

const router: Router = Router();

router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { businessSlug, conversationId, customer, note } = req.body ?? {};

    const handoffRequest = await createHandoffRequest({
      businessSlug: typeof businessSlug === 'string' ? businessSlug : undefined,
      conversationId:
        typeof conversationId === 'string' ? conversationId : undefined,
      customer,
      note: typeof note === 'string' ? note : undefined,
    });

    return ok(
      res,
      {
        handoffRequest,
        message: '轉真人請求已建立。',
      },
      201,
    );
  }),
);

export const handoffRouter: Router = router;
