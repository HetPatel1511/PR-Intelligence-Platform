import type { PrismaClient } from '@prisma/client';

import { createGitHubService } from '../github/github.factory.js';
import { RepositoryService } from '../repositories/repository.service.js';
import { PullRequestService } from '../pull-requests/pull-request.service.js';

export interface SyncServices {
  repositories: RepositoryService;
  pullRequests: PullRequestService;
}

/**
 * Composition root for a sync run: given a user's decrypted GitHub token, build
 * a GitHub service and inject it (with Prisma) into the repository and
 * pull-request services. This is the single place the object graph is wired —
 * routes/jobs call this rather than constructing services by hand.
 */
export function createSyncServices(token: string, prisma: PrismaClient): SyncServices {
  const github = createGitHubService(token);
  return {
    repositories: new RepositoryService({ prisma, github }),
    pullRequests: new PullRequestService({ prisma, github }),
  };
}
