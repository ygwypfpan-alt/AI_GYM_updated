import { Router } from 'express';

import { ok } from '../lib/http.js';

const router: Router = Router();

router.get('/', (_req, res) =>
  ok(res, {
    ok: true,
    service: 'ai-gym-api',
    timestamp: new Date().toISOString(),
  }),
);

export const healthRouter: Router = router;
