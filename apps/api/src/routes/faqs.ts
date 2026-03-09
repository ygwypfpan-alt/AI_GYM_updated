import { Router } from 'express';

import { asyncHandler, ok } from '../lib/http.js';
import { searchFaqItems } from '../services/faq-service.js';

const router: Router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    const businessSlug =
      typeof req.query.businessSlug === 'string'
        ? req.query.businessSlug
        : undefined;
    const query = typeof req.query.query === 'string' ? req.query.query : undefined;
    const limitValue =
      typeof req.query.limit === 'string' ? Number(req.query.limit) : undefined;

    const items = await searchFaqItems({
      businessSlug,
      query,
      limit: Number.isFinite(limitValue) ? limitValue : undefined,
    });

    return ok(res, { items });
  }),
);

export const faqsRouter: Router = router;
