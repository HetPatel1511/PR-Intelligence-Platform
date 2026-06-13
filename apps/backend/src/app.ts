import express, { type Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';

import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { swaggerServe, swaggerSetup } from './docs/swagger.js';
import { errorHandler, notFoundHandler } from './middleware/error-handler.js';

/**
 * Builds the Express app with global middleware and the API router mounted
 * under `/api`. Kept separate from `index.ts` so it can be imported by tests
 * without starting a real HTTP listener.
 */
export function createApp(): Express {
  const app = express();

  // Request logging (concise in dev, Apache-style in prod).
  app.use(morgan(env.isProduction ? 'combined' : 'dev'));

  // API docs are mounted before helmet so Swagger UI's inline assets aren't
  // blocked by the strict Content-Security-Policy applied to the API itself.
  app.use('/api/docs', swaggerServe, swaggerSetup);

  app.use(helmet());
  app.use(cors({ origin: env.CLIENT_URL, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.use('/api', apiRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
