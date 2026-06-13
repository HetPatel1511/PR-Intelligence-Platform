import { z } from 'zod';
import type { Repository } from '@prisma/client';

import { paginationSchema } from '../../utils/pagination.js';

// --- Request validation schemas ---

export const repositoryParams = z.object({
  repositoryId: z.string().min(1),
});
export type RepositoryParams = z.infer<typeof repositoryParams>;

export const listRepositoriesQuery = paginationSchema.extend({
  search: z.string().trim().min(1).optional(),
  sortBy: z.enum(['fullName', 'lastSyncedAt', 'createdAt']).default('fullName'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});
export type ListRepositoriesQuery = z.infer<typeof listRepositoriesQuery>;

// --- Response DTO ---

export interface RepositoryDto {
  id: string;
  githubId: string;
  owner: string;
  name: string;
  fullName: string;
  isPrivate: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
}

export function toRepositoryDto(repo: Repository): RepositoryDto {
  return {
    id: repo.id,
    githubId: repo.githubId.toString(),
    owner: repo.owner,
    name: repo.name,
    fullName: repo.fullName,
    isPrivate: repo.isPrivate,
    lastSyncedAt: repo.lastSyncedAt?.toISOString() ?? null,
    createdAt: repo.createdAt.toISOString(),
  };
}
