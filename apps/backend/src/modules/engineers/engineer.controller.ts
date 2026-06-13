import type { Request, Response } from 'express';

import { prisma } from '../../lib/prisma.js';
import { getValidated } from '../../middleware/validate.js';
import { RepositoryQueryService } from '../repositories/repository.query.service.js';
import { type RepositoryParams } from '../repositories/repository.dto.js';
import { createMetricsService } from '../metrics/metrics.factory.js';
import { EngineerQueryService } from './engineer.query.service.js';
import { toEngineerRef, type EngineerParams, type EngineerWithMetricsDto } from './engineer.dto.js';

const engineerQuery = new EngineerQueryService(prisma);
const repositoryQuery = new RepositoryQueryService(prisma);
const metricsService = createMetricsService(prisma);

/** GET /repositories/:repositoryId/engineers — profiles joined with metrics. */
export async function listRepositoryEngineers(req: Request, res: Response): Promise<void> {
  const { repositoryId } = getValidated<RepositoryParams>(res, 'params');
  await repositoryQuery.getOwned(req.user!.id, repositoryId); // ownership

  const [engineers, metrics] = await Promise.all([
    engineerQuery.listForRepository(repositoryId),
    metricsService.getEngineerMetrics(repositoryId),
  ]);
  const metricsById = new Map(metrics.map((m) => [m.engineerId, m]));

  const data: EngineerWithMetricsDto[] = engineers.map((engineer) => ({
    ...toEngineerRef(engineer),
    metrics: metricsById.get(engineer.id) ?? null,
  }));

  res.json({ data });
}

/** GET /engineers/:id — engineer profile. */
export async function getEngineer(_req: Request, res: Response): Promise<void> {
  const { id } = getValidated<EngineerParams>(res, 'params');
  const engineer = await engineerQuery.getById(id);
  res.json({ data: toEngineerRef(engineer) });
}
