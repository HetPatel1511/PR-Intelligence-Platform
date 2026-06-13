import type { Engineer, PrismaClient, Repository } from '@prisma/client';

import { HttpError } from '../../utils/http-error.js';
import type { IGitHubService } from '../github/github.service.js';
import type {
  CommitDTO,
  EngineerDTO,
  FileDTO,
  PullRequestDTO,
  ReviewCommentDTO,
  ReviewDTO,
} from '../github/github.dto.js';

export interface PullRequestServiceDeps {
  prisma: PrismaClient;
  github: IGitHubService;
}

export interface SyncResult {
  repositoryId: string;
  totalPullRequests: number;
  synced: number;
  failures: Array<{ number: number; error: string }>;
}

/** Caches engineers upserted during a single sync run to cut duplicate writes. */
type EngineerCache = Map<string, Engineer>;

/**
 * Owns persistence and sync for pull requests and their nested data (reviews,
 * requested reviewers, review comments, commits, changed files). Prisma and the
 * GitHub service abstraction are injected. All writes are idempotent upserts so
 * a re-sync is safe.
 */
export class PullRequestService {
  constructor(private readonly deps: PullRequestServiceDeps) {}

  /**
   * Historical sync of every PR in a connected repository. One failing PR is
   * recorded and skipped rather than aborting the whole run.
   */
  async syncRepositoryPullRequests(repositoryId: string): Promise<SyncResult> {
    const { prisma, github } = this.deps;

    const repo = await prisma.repository.findUnique({ where: { id: repositoryId } });
    if (!repo) {
      throw HttpError.notFound('Repository not found');
    }

    const numbers = await github.listPullRequestNumbers(repo.owner, repo.name);
    const cache: EngineerCache = new Map();
    const failures: SyncResult['failures'] = [];

    for (const number of numbers) {
      try {
        await this.syncPullRequest(repo, number, cache);
      } catch (err) {
        failures.push({ number, error: err instanceof Error ? err.message : 'Unknown error' });
        console.error(`Failed to sync PR #${number} of ${repo.fullName}:`, err);
      }
    }

    await prisma.repository.update({
      where: { id: repo.id },
      data: { lastSyncedAt: new Date() },
    });

    return {
      repositoryId: repo.id,
      totalPullRequests: numbers.length,
      synced: numbers.length - failures.length,
      failures,
    };
  }

  /** Fetch and persist one PR plus all of its related data. */
  private async syncPullRequest(
    repo: Repository,
    number: number,
    cache: EngineerCache,
  ): Promise<void> {
    const { github } = this.deps;
    const { owner, name } = repo;

    const [detail, reviews, comments, requestedReviewers, commits, files] = await Promise.all([
      github.getPullRequest(owner, name, number),
      github.listReviews(owner, name, number),
      github.listReviewComments(owner, name, number),
      github.listRequestedReviewers(owner, name, number),
      github.listCommits(owner, name, number),
      github.listFiles(owner, name, number),
    ]);

    const pullRequestId = await this.persistPullRequest(repo.id, detail, reviews, cache);

    await this.persistReviews(pullRequestId, reviews, cache);
    await this.persistReviewComments(pullRequestId, comments, cache);
    await this.persistRequestedReviewers(pullRequestId, requestedReviewers, cache);
    await this.persistCommits(pullRequestId, commits, cache);
    await this.persistFiles(pullRequestId, files);
  }

  private async persistPullRequest(
    repositoryId: string,
    detail: PullRequestDTO,
    reviews: ReviewDTO[],
    cache: EngineerCache,
  ): Promise<string> {
    const { prisma } = this.deps;
    const author = detail.author ? await this.upsertEngineer(detail.author, cache) : null;

    const data = {
      number: detail.number,
      title: detail.title,
      status: detail.status,
      additions: detail.additions,
      deletions: detail.deletions,
      changedFiles: detail.changedFiles,
      commentCount: detail.commentCount,
      createdAt: detail.createdAt,
      updatedAt: detail.updatedAt,
      mergedAt: detail.mergedAt,
      closedAt: detail.closedAt,
      firstReviewAt: earliestReview(reviews),
    };

    const pr = await prisma.pullRequest.upsert({
      where: { githubId: detail.githubId },
      update: { ...data, authorId: author?.id ?? null },
      create: {
        githubId: detail.githubId,
        ...data,
        repository: { connect: { id: repositoryId } },
        ...(author ? { author: { connect: { id: author.id } } } : {}),
      },
    });

    return pr.id;
  }

  private async persistReviews(
    pullRequestId: string,
    reviews: ReviewDTO[],
    cache: EngineerCache,
  ): Promise<void> {
    const { prisma } = this.deps;

    for (const review of reviews) {
      if (!review.reviewer) continue; // A review with no resolvable author is unusable.
      const reviewer = await this.upsertEngineer(review.reviewer, cache);

      await prisma.review.upsert({
        where: { githubId: review.githubId },
        update: { state: review.state, submittedAt: review.submittedAt, reviewerId: reviewer.id },
        create: {
          githubId: review.githubId,
          state: review.state,
          submittedAt: review.submittedAt,
          pullRequest: { connect: { id: pullRequestId } },
          reviewer: { connect: { id: reviewer.id } },
        },
      });
    }
  }

  private async persistReviewComments(
    pullRequestId: string,
    comments: ReviewCommentDTO[],
    cache: EngineerCache,
  ): Promise<void> {
    const { prisma } = this.deps;

    for (const comment of comments) {
      if (!comment.author) continue;
      const author = await this.upsertEngineer(comment.author, cache);

      await prisma.reviewComment.upsert({
        where: { githubId: comment.githubId },
        update: { body: comment.body, path: comment.path, line: comment.line, authorId: author.id },
        create: {
          githubId: comment.githubId,
          body: comment.body,
          path: comment.path,
          line: comment.line,
          createdAt: comment.createdAt,
          pullRequest: { connect: { id: pullRequestId } },
          author: { connect: { id: author.id } },
        },
      });
    }
  }

  private async persistRequestedReviewers(
    pullRequestId: string,
    reviewers: EngineerDTO[],
    cache: EngineerCache,
  ): Promise<void> {
    const ids: Array<{ id: string }> = [];
    for (const dto of reviewers) {
      const engineer = await this.upsertEngineer(dto, cache);
      ids.push({ id: engineer.id });
    }

    // `set` makes the relation reflect exactly the currently-requested reviewers.
    await this.deps.prisma.pullRequest.update({
      where: { id: pullRequestId },
      data: { requestedReviewers: { set: ids } },
    });
  }

  private async persistCommits(
    pullRequestId: string,
    commits: CommitDTO[],
    cache: EngineerCache,
  ): Promise<void> {
    const { prisma } = this.deps;

    for (const commit of commits) {
      const author = commit.author ? await this.upsertEngineer(commit.author, cache) : null;

      await prisma.commit.upsert({
        where: { sha: commit.sha },
        update: {
          message: commit.message,
          authoredAt: commit.authoredAt,
          authorId: author?.id ?? null,
        },
        create: {
          sha: commit.sha,
          message: commit.message,
          authoredAt: commit.authoredAt,
          pullRequest: { connect: { id: pullRequestId } },
          ...(author ? { author: { connect: { id: author.id } } } : {}),
        },
      });
    }
  }

  /** Files are a snapshot: replace the set so renames/removals don't linger. */
  private async persistFiles(pullRequestId: string, files: FileDTO[]): Promise<void> {
    const { prisma } = this.deps;

    await prisma.$transaction([
      prisma.pullRequestFile.deleteMany({ where: { pullRequestId } }),
      prisma.pullRequestFile.createMany({
        data: files.map((file) => ({
          pullRequestId,
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          changes: file.changes,
        })),
      }),
    ]);
  }

  /** Upsert an engineer, memoized per sync run. */
  private async upsertEngineer(dto: EngineerDTO, cache: EngineerCache): Promise<Engineer> {
    const key = dto.githubId.toString();
    const cached = cache.get(key);
    if (cached) return cached;

    const engineer = await this.deps.prisma.engineer.upsert({
      where: { githubId: dto.githubId },
      update: { login: dto.login, name: dto.name, avatarUrl: dto.avatarUrl },
      create: {
        githubId: dto.githubId,
        login: dto.login,
        name: dto.name,
        avatarUrl: dto.avatarUrl,
      },
    });

    cache.set(key, engineer);
    return engineer;
  }
}

/** Earliest submitted review timestamp — the basis for "time to first review". */
function earliestReview(reviews: ReviewDTO[]): Date | null {
  const times = reviews
    .map((review) => review.submittedAt)
    .filter((date): date is Date => date !== null)
    .map((date) => date.getTime());

  return times.length > 0 ? new Date(Math.min(...times)) : null;
}
