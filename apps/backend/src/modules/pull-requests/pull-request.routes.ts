import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { repositoryParams } from '../repositories/repository.dto.js';
import { getPullRequest, listPullRequests } from './pull-request.controller.js';
import { listPullRequestsQuery, pullRequestParams } from './pull-request.dto.js';

/** Nested at /repositories/:repositoryId/pull-requests (auth inherited from parent). */
export const repositoryPullRequestsRouter = Router({ mergeParams: true });
repositoryPullRequestsRouter.get(
  '/',
  validate({ params: repositoryParams, query: listPullRequestsQuery }),
  asyncHandler(listPullRequests),
);

/** Mounted at /pull-requests. */
export const pullRequestRouter = Router();
pullRequestRouter.use(authenticate);
pullRequestRouter.get(
  '/:id',
  validate({ params: pullRequestParams }),
  asyncHandler(getPullRequest),
);
