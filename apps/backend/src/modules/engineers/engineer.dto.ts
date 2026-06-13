import { z } from 'zod';
import type { Engineer } from '@prisma/client';

import type { EngineerMetrics } from '../metrics/metrics.types.js';

export const engineerParams = z.object({
  id: z.string().min(1),
});
export type EngineerParams = z.infer<typeof engineerParams>;

export interface EngineerRefDto {
  id: string;
  githubId: string;
  login: string;
  name: string | null;
  avatarUrl: string | null;
}

/** Compact engineer reference, embedded in PR/review payloads. */
export function toEngineerRef(engineer: Engineer): EngineerRefDto {
  return {
    id: engineer.id,
    githubId: engineer.githubId.toString(),
    login: engineer.login,
    name: engineer.name,
    avatarUrl: engineer.avatarUrl,
  };
}

/** Engineer profile joined with their computed metrics for the dashboard. */
export interface EngineerWithMetricsDto extends EngineerRefDto {
  metrics: EngineerMetrics | null;
}
