import { Prisma, type PrismaClient, type Repository } from '@prisma/client';

import { HttpError } from '../../utils/http-error.js';
import { toSkipTake, type PaginationParams } from '../../utils/pagination.js';
import type { ListRepositoriesQuery } from './repository.dto.js';

/**
 * Read-only repository access for the API. Prisma is the only dependency (no
 * GitHub token needed), keeping query endpoints decoupled from the sync layer.
 */
export class RepositoryQueryService {
  constructor(private readonly prisma: PrismaClient) {}

  /** Paginated, filterable, sortable list of a user's connected repositories. */
  async list(
    userId: string,
    query: ListRepositoriesQuery,
  ): Promise<{ rows: Repository[]; total: number }> {
    const where: Prisma.RepositoryWhereInput = {
      connectedById: userId,
      ...(query.search
        ? { fullName: { contains: query.search, mode: Prisma.QueryMode.insensitive } }
        : {}),
    };

    const { skip, take } = toSkipTake(query satisfies PaginationParams);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.repository.findMany({
        where,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take,
      }),
      this.prisma.repository.count({ where }),
    ]);

    return { rows, total };
  }

  /** Fetch a repository, enforcing that it belongs to the requesting user. */
  async getOwned(userId: string, repositoryId: string): Promise<Repository> {
    const repo = await this.prisma.repository.findUnique({ where: { id: repositoryId } });
    if (!repo) {
      throw HttpError.notFound('Repository not found');
    }
    if (repo.connectedById !== userId) {
      throw HttpError.forbidden('You do not have access to this repository');
    }
    return repo;
  }
}
