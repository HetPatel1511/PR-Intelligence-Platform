import { Router } from 'express';

import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler } from '../../utils/async-handler.js';
import { repositoryParams } from '../repositories/repository.dto.js';
import { getEngineer, listRepositoryEngineers } from './engineer.controller.js';
import { engineerParams } from './engineer.dto.js';

/** Nested at /repositories/:repositoryId/engineers (auth inherited from parent). */
export const repositoryEngineersRouter = Router({ mergeParams: true });
repositoryEngineersRouter.get(
  '/',
  validate({ params: repositoryParams }),
  asyncHandler(listRepositoryEngineers),
);

/** Mounted at /engineers. */
export const engineerRouter = Router();
engineerRouter.use(authenticate);
engineerRouter.get('/:id', validate({ params: engineerParams }), asyncHandler(getEngineer));
