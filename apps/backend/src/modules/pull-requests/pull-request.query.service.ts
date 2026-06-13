import { Prisma, type PrismaClient } from '@prisma/client';

import { HttpError } from '../../utils/http-error.js';
import { toSkipTake } from '../../utils/pagination.js';
import {
  pullRequestDetailInclude,
  pullRequestListInclude,
  type ListPullRequestsQuery,
  type PullRequestDetailRow,
  type PullRequestListRow,
} from './pull-request.dto.js';

/**
 * Read-only pull-request access for the API. Prisma-only; supports pagination,
 * filtering (status/author/title) and sorting.
 */
export class PullRequestQueryService {
  constructor(private readonly prisma: PrismaClient) {}

  async listByRepository(
    repositoryId: string,
    query: ListPullRequestsQuery,
  ): Promise<{ rows: PullRequestListRow[]; total: number }> {
    const where: Prisma.PullRequestWhereInput = {
      repositoryId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.authorId ? { authorId: query.authorId } : {}),
      ...(query.search
        ? { title: { contains: query.search, mode: Prisma.QueryMode.insensitive } }
        : {}),
    };

    const { skip, take } = toSkipTake(query);
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.pullRequest.findMany({
        where,
        include: pullRequestListInclude,
        orderBy: { [query.sortBy]: query.sortOrder },
        skip,
        take,
      }),
      this.prisma.pullRequest.count({ where }),
    ]);

    return { rows, total };
  }

  /** PR detail, enforcing that it belongs to a repository owned by the user. */
  async getOwnedDetail(userId: string, pullRequestId: string): Promise<PullRequestDetailRow> {
    const pr = await this.prisma.pullRequest.findUnique({
      where: { id: pullRequestId },
      include: pullRequestDetailInclude,
    });
    if (!pr) {
      throw HttpError.notFound('Pull request not found');
    }
    if (pr.repository.connectedById !== userId) {
      throw HttpError.forbidden('You do not have access to this pull request');
    }
    return pr;
  }
}
