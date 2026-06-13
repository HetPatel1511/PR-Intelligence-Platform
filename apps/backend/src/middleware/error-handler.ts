import type { NextFunction, Request, Response } from 'express';

import { env } from '../config/env.js';
import { HttpError } from '../utils/http-error.js';

/** 404 handler for unmatched routes. */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ error: 'Not Found' });
}

/**
 * Central error handler. Known `HttpError`s map to their status; anything else
 * is treated as an unexpected 500 and its message is hidden in production to
 * avoid leaking internals. Route handlers can simply throw.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof HttpError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error(err);

  const message = env.isProduction
    ? 'Internal Server Error'
    : err instanceof Error
      ? err.message
      : 'Internal Server Error';

  res.status(500).json({ error: message });
}
