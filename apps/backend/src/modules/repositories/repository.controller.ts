import type { Request, Response } from 'express';

import { prisma } from '../../lib/prisma.js';
import { getValidated } from '../../middleware/validate.js';
import { paginate } from '../../utils/pagination.js';
import { getUserGitHubToken } from '../auth/auth.service.js';
import { createSyncServices } from '../sync/sync.factory.js';
import { RepositoryQueryService } from './repository.query.service.js';
import {
  toRepositoryDto,
  type ListRepositoriesQuery,
  type RepositoryParams,
} from './repository.dto.js';

const repositoryQuery = new RepositoryQueryService(prisma);

/** GET /repositories — paginated list of the user's connected repositories. */
export async function listRepositories(req: Request, res: Response): Promise<void> {
  const query = getValidated<ListRepositoriesQuery>(res, 'query');
  const { rows, total } = await repositoryQuery.list(req.user!.id, query);
  res.json(paginate(rows.map(toRepositoryDto), query, total));
}

/** GET /repositories/:repositoryId — a single repository. */
export async function getRepository(req: Request, res: Response): Promise<void> {
  const { repositoryId } = getValidated<RepositoryParams>(res, 'params');
  const repo = await repositoryQuery.getOwned(req.user!.id, repositoryId);
  res.json({ data: toRepositoryDto(repo) });
}

/** POST /repositories/sync — refresh the repository list from GitHub. */
export async function syncRepositories(req: Request, res: Response): Promise<void> {
  const token = await getUserGitHubToken(req.user!.id);
  const { repositories } = createSyncServices(token, prisma);
  const synced = await repositories.syncUserRepositories(req.user!.id);
  res.json({ data: synced.map(toRepositoryDto), count: synced.length });
}

/** POST /repositories/:repositoryId/sync — historical PR sync for one repository. */
export async function syncRepositoryPullRequests(req: Request, res: Response): Promise<void> {
  const { repositoryId } = getValidated<RepositoryParams>(res, 'params');
  // Ownership check before doing any GitHub work.
  await repositoryQuery.getOwned(req.user!.id, repositoryId);

  const token = await getUserGitHubToken(req.user!.id);
  const { pullRequests } = createSyncServices(token, prisma);
  const result = await pullRequests.syncRepositoryPullRequests(repositoryId);

  res.status(202).json({ data: result });
}
