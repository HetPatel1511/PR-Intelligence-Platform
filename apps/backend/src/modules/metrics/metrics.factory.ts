import type { PrismaClient } from '@prisma/client';

import { MetricsService } from './metrics.service.js';

/**
 * Builds the metrics engine. Unlike the sync services it needs no GitHub token —
 * the engine reads only from the database — so its sole dependency is Prisma.
 */
export function createMetricsService(prisma: PrismaClient): MetricsService {
  return new MetricsService({ prisma });
}
