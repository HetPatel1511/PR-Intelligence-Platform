import { Router } from 'express';

import { authRouter } from '../modules/auth/auth.routes.js';
import { repositoryRouter } from '../modules/repositories/repository.routes.js';
import { pullRequestRouter } from '../modules/pull-requests/pull-request.routes.js';
import { engineerRouter } from '../modules/engineers/engineer.routes.js';

/** Top-level API router. Feature routers are mounted here. */
export const apiRouter = Router();

apiRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

apiRouter.use('/auth', authRouter);
apiRouter.use('/repositories', repositoryRouter);
apiRouter.use('/pull-requests', pullRequestRouter);
apiRouter.use('/engineers', engineerRouter);
