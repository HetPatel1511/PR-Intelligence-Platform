import { Router } from 'express';

import { authRouter } from '../modules/auth/auth.routes.js';

/**
 * Top-level API router. Feature routers are mounted here as they are built
 * (repositories, pull-requests, metrics to follow).
 */
export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

apiRouter.use('/auth', authRouter);
