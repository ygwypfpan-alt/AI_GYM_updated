import { Router } from 'express';

import { asyncHandler, AppError, ok } from '../lib/http.js';
import { processChatMessage } from '../services/chat-service.js';

const router: Router = Router();

router.post(
  '/message',
  asyncHandler(async (req, res) => {
    const { businessSlug, conversationId, customer, message } = req.body ?? {};

    if (typeof message !== 'string' || message.trim().length === 0) {
      throw new AppError('message 為必填。', 400);
    }

    const response = await processChatMessage({
      businessSlug: typeof businessSlug === 'string' ? businessSlug : undefined,
      conversationId:
        typeof conversationId === 'string' ? conversationId : undefined,
      customer,
      message,
    });

    return ok(res, response);
  }),
);

export const chatRouter: Router = router;
