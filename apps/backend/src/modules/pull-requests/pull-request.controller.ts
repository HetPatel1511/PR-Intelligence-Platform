import type { Request, Response } from 'express';

import { prisma } from '../../lib/prisma.js';
import { getValidated } from '../../middleware/validate.js';
import { paginate } from '../../utils/pagination.js';
import { RepositoryQueryService } from '../repositories/repository.query.service.js';
import { type RepositoryParams } from '../repositories/repository.dto.js';
import { createMetricsService } from '../metrics/metrics.factory.js';
import { PullRequestQueryService } from './pull-request.query.service.js';
import {
  toPullRequestDetailDto,
  toPullRequestSummaryDto,
  type ListPullRequestsQuery,
  type PullRequestParams,
} from './pull-request.dto.js';

const pullRequestQuery = new PullRequestQueryService(prisma);
const repositoryQuery = new RepositoryQueryService(prisma);
const metricsService = createMetricsService(prisma);

/** GET /repositories/:repositoryId/pull-requests — paginated, filtered, sorted. */
export async function listPullRequests(req: Request, res: Response): Promise<void> {
  const { repositoryId } = getValidated<RepositoryParams>(res, 'params');
  await repositoryQuery.getOwned(req.user!.id, repositoryId); // ownership

  const query = getValidated<ListPullRequestsQuery>(res, 'query');
  const { rows, total } = await pullRequestQuery.listByRepository(repositoryId, query);

  res.json(paginate(rows.map(toPullRequestSummaryDto), query, total));
}

/** GET /pull-requests/:id — full detail plus computed metrics. */
export async function getPullRequest(req: Request, res: Response): Promise<void> {
  const { id } = getValidated<PullRequestParams>(res, 'params');
  const pr = await pullRequestQuery.getOwnedDetail(req.user!.id, id);
  const metrics = await metricsService.getPullRequestMetrics(id);

  res.json({ data: { ...toPullRequestDetailDto(pr), metrics } });
}
