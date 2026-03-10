import type { RequestHandler } from 'express';

import { config } from '../config.js';
import { verifyAdminToken } from '../lib/auth.js';
import { AppError } from '../lib/http.js';

export const requireAdminAuth: RequestHandler = (req, res, next) => {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Unauthorized.', 401));
  }

  const token = header.slice('Bearer '.length).trim();
  const payload = verifyAdminToken(token, config.adminJwtSecret);

  res.locals.adminUsername = payload.username;
  return next();
};
