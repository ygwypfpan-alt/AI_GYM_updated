import type { NextFunction, Request, RequestHandler, Response } from 'express';

export class AppError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
  }
}

export function ok<T>(res: Response, data: T, statusCode = 200): Response {
  return res.status(statusCode).json({
    success: true,
    data,
  });
}

export function fail(
  res: Response,
  message: string,
  statusCode = 400,
): Response {
  return res.status(statusCode).json({
    success: false,
    error: message,
  });
}

export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
}
