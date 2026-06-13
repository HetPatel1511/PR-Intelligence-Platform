import type { PrismaClient, Repository } from '@prisma/client';

import type { IGitHubService } from '../github/github.service.js';

export interface RepositoryServiceDeps {
  prisma: PrismaClient;
  github: IGitHubService;
}

/**
 * Owns persistence and sync for repositories. Dependencies (Prisma + the GitHub
 * service abstraction) are injected, so this can be tested without a real DB or
 * network and reused across callers.
 */
export class RepositoryService {
  constructor(private readonly deps: RepositoryServiceDeps) {}

  /**
   * Fetch the authenticated user's repositories from GitHub and upsert them,
   * attributing newly-discovered repos to the connecting user. Idempotent.
   */
  async syncUserRepositories(userId: string): Promise<Repository[]> {
    const { prisma, github } = this.deps;
    const repos = await github.listRepositories();

    const saved: Repository[] = [];
    for (const repo of repos) {
      saved.push(
        await prisma.repository.upsert({
          where: { githubId: repo.githubId },
          update: {
            owner: repo.owner,
            name: repo.name,
            fullName: repo.fullName,
            isPrivate: repo.isPrivate,
          },
          create: {
            githubId: repo.githubId,
            owner: repo.owner,
            name: repo.name,
            fullName: repo.fullName,
            isPrivate: repo.isPrivate,
            connectedBy: { connect: { id: userId } },
          },
        }),
      );
    }

    return saved;
  }

  /** Repositories connected by a given user. */
  listConnectedRepositories(userId: string): Promise<Repository[]> {
    return this.deps.prisma.repository.findMany({
      where: { connectedById: userId },
      orderBy: { fullName: 'asc' },
    });
  }
}
