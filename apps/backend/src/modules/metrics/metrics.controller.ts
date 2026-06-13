import type { Request, Response } from 'express';

import { prisma } from '../../lib/prisma.js';
import { getValidated } from '../../middleware/validate.js';
import { RepositoryQueryService } from '../repositories/repository.query.service.js';
import { type RepositoryParams } from '../repositories/repository.dto.js';
import { createMetricsService } from './metrics.factory.js';

const metricsService = createMetricsService(prisma);
const repositoryQuery = new RepositoryQueryService(prisma);

/** Resolve + authorize the repository id shared by every metrics route. */
async function ownedRepositoryId(req: Request, res: Response): Promise<string> {
  const { repositoryId } = getValidated<RepositoryParams>(res, 'params');
  await repositoryQuery.getOwned(req.user!.id, repositoryId);
  return repositoryId;
}

/** GET /repositories/:repositoryId/metrics/summary */
export async function getSummary(req: Request, res: Response): Promise<void> {
  const repositoryId = await ownedRepositoryId(req, res);
  res.json({ data: await metricsService.getDashboardSummary(repositoryId) });
}

/** GET /repositories/:repositoryId/metrics/pull-requests */
export async function getPullRequestMetrics(req: Request, res: Response): Promise<void> {
  const repositoryId = await ownedRepositoryId(req, res);
  res.json({ data: await metricsService.getRepositoryPullRequestMetrics(repositoryId) });
}

/** GET /repositories/:repositoryId/metrics/engineers */
export async function getEngineerMetrics(req: Request, res: Response): Promise<void> {
  const repositoryId = await ownedRepositoryId(req, res);
  res.json({ data: await metricsService.getEngineerMetrics(repositoryId) });
}
