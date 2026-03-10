import cors from 'cors';
import express from 'express';

import { config } from './config.js';
import { fail, AppError } from './lib/http.js';
import { adminRouter } from './routes/admin.js';
import { availabilityRouter } from './routes/availability.js';
import { bookingsRouter } from './routes/bookings.js';
import { chatRouter } from './routes/chat.js';
import { faqsRouter } from './routes/faqs.js';
import { handoffRouter } from './routes/handoff.js';
import { healthRouter } from './routes/health.js';
import { servicesRouter } from './routes/services.js';

export function createApp(): express.Express {
  const app = express();

  app.use(
    cors({
      origin: config.corsOrigins.length === 1 ? config.corsOrigins[0] : config.corsOrigins,
      credentials: false,
    }),
  );
  app.use(express.json());

  app.get('/', (_req, res) =>
    res.json({
      name: 'AI GYM API',
      docs: {
        health: '/health',
        services: '/api/services',
        faqs: '/api/faqs',
        availability: '/api/availability',
        bookings: '/api/bookings',
        bookingLookup: '/api/bookings/lookup',
        chat: '/api/chat/message',
        handoff: '/api/handoff-requests',
        adminLogin: '/api/admin/login',
        adminMe: '/api/admin/me',
        adminDashboard: '/api/admin/dashboard',
      },
    }),
  );

  app.use('/health', healthRouter);
  app.use('/api/services', servicesRouter);
  app.use('/api/faqs', faqsRouter);
  app.use('/api/availability', availabilityRouter);
  app.use('/api/bookings', bookingsRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/handoff-requests', handoffRouter);
  app.use('/api/admin', adminRouter);

  app.use((_req, res) => fail(res, '找不到此 API 路徑。', 404));

  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (error instanceof AppError) {
      return fail(res, error.message, error.statusCode);
    }

    console.error('Unhandled API error:', error);
    return fail(res, '伺服器發生未預期錯誤。', 500);
  });

  return app;
}
