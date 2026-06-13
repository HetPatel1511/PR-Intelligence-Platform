import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { repositoryEngineersRouter } from '../engineers/engineer.routes.js';
import { metricsRouter } from '../metrics/metrics.routes.js';
import { repositoryPullRequestsRouter } from '../pull-requests/pull-request.routes.js';
import {
  getRepository,
  listRepositories,
  syncRepositories,
  syncRepositoryPullRequests,
} from './repository.controller.js';
import { listRepositoriesQuery, repositoryParams } from './repository.dto.js';

export const repositoryRouter = Router();

// Every repository route requires a session.
repositoryRouter.use(authenticate);

repositoryRouter.get(
  '/',
  validate({ query: listRepositoriesQuery }),
  asyncHandler(listRepositories),
);
repositoryRouter.post('/sync', asyncHandler(syncRepositories));
repositoryRouter.get(
  '/:repositoryId',
  validate({ params: repositoryParams }),
  asyncHandler(getRepository),
);
repositoryRouter.post(
  '/:repositoryId/sync',
  validate({ params: repositoryParams }),
  asyncHandler(syncRepositoryPullRequests),
);

// Nested sub-resources (inherit the authenticate middleware above).
repositoryRouter.use('/:repositoryId/pull-requests', repositoryPullRequestsRouter);
repositoryRouter.use('/:repositoryId/engineers', repositoryEngineersRouter);
repositoryRouter.use('/:repositoryId/metrics', metricsRouter);
