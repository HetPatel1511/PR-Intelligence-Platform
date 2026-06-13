import { Router } from 'express';

import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { repositoryParams } from '../repositories/repository.dto.js';
import { getEngineerMetrics, getPullRequestMetrics, getSummary } from './metrics.controller.js';

/** Nested at /repositories/:repositoryId/metrics (auth inherited from parent). */
export const metricsRouter = Router({ mergeParams: true });

metricsRouter.get('/summary', validate({ params: repositoryParams }), asyncHandler(getSummary));
metricsRouter.get(
  '/pull-requests',
  validate({ params: repositoryParams }),
  asyncHandler(getPullRequestMetrics),
);
metricsRouter.get(
  '/engineers',
  validate({ params: repositoryParams }),
  asyncHandler(getEngineerMetrics),
);
