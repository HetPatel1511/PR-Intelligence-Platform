import type { Engineer, PrismaClient } from '@prisma/client';

import { HttpError } from '../../utils/http-error.js';

/** Read-only engineer access for the API. Prisma-only. */
export class EngineerQueryService {
  constructor(private readonly prisma: PrismaClient) {}

  /** Engineers who authored or reviewed at least one PR in the repository. */
  listForRepository(repositoryId: string): Promise<Engineer[]> {
    return this.prisma.engineer.findMany({
      where: {
        OR: [
          { authoredPrs: { some: { repositoryId } } },
          { reviews: { some: { pullRequest: { repositoryId } } } },
        ],
      },
      orderBy: { login: 'asc' },
    });
  }

  async getById(id: string): Promise<Engineer> {
    const engineer = await this.prisma.engineer.findUnique({ where: { id } });
    if (!engineer) {
      throw HttpError.notFound('Engineer not found');
    }
    return engineer;
  }
}
