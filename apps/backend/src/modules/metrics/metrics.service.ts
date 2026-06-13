import { Prisma, type PrismaClient } from '@prisma/client';

import { HttpError } from '../../utils/http-error.js';
import { roundTo, sum } from './calculators/aggregate.js';
import { computePullRequestMetrics } from './calculators/pull-request.calculator.js';
import { computeEngineerMetrics } from './calculators/engineer.calculator.js';
import type {
  DashboardSummary,
  EngineerInput,
  EngineerMetrics,
  EngineerReviewRecord,
  PullRequestMetrics,
  PullRequestRecord,
} from './metrics.types.js';

export interface MetricsServiceDeps {
  prisma: PrismaClient;
}

/** Relations the calculators need loaded alongside each PR. */
const pullRequestInclude = {
  reviews: true,
  requestedReviewers: { select: { id: true } },
} satisfies Prisma.PullRequestInclude;

type PullRequestWithRelations = Prisma.PullRequestGetPayload<{
  include: typeof pullRequestInclude;
}>;

/**
 * The metrics engine. The ONLY layer aware of Prisma: it loads stored records,
 * maps them to plain shapes, and delegates to pure calculators. It performs no
 * GitHub calls — it operates purely on what is already in the database.
 */
export class MetricsService {
  constructor(private readonly deps: MetricsServiceDeps) {}

  /** Metrics for a single pull request. */
  async getPullRequestMetrics(pullRequestId: string): Promise<PullRequestMetrics> {
    const pr = await this.deps.prisma.pullRequest.findUnique({
      where: { id: pullRequestId },
      include: pullRequestInclude,
    });
    if (!pr) {
      throw HttpError.notFound('Pull request not found');
    }
    return computePullRequestMetrics(toPullRequestRecord(pr));
  }

  /** Metrics for every pull request in a repository. */
  async getRepositoryPullRequestMetrics(repositoryId: string): Promise<PullRequestMetrics[]> {
    const prs = await this.deps.prisma.pullRequest.findMany({
      where: { repositoryId },
      include: pullRequestInclude,
      orderBy: { number: 'asc' },
    });
    return prs.map((pr) => computePullRequestMetrics(toPullRequestRecord(pr)));
  }

  /**
   * Per-engineer metrics across a repository. Includes anyone who authored or
   * reviewed a PR in scope, even if they never logged into the platform.
   */
  async getEngineerMetrics(repositoryId: string): Promise<EngineerMetrics[]> {
    const prs = await this.deps.prisma.pullRequest.findMany({
      where: { repositoryId },
      include: pullRequestInclude,
    });
    const records = prs.map(toPullRequestRecord);

    return buildEngineerInputs(records).map(computeEngineerMetrics);
  }

  /** Repository rollup for the dashboard: totals, averages, and code volume. */
  async getDashboardSummary(repositoryId: string): Promise<DashboardSummary> {
    const prs = await this.deps.prisma.pullRequest.findMany({
      where: { repositoryId },
      include: pullRequestInclude,
    });
    const records = prs.map(toPullRequestRecord);
    const prMetrics = records.map(computePullRequestMetrics);
    const engineerCount = buildEngineerInputs(records).length;

    return {
      repositoryId,
      totals: {
        pullRequests: prMetrics.length,
        open: prMetrics.filter((m) => m.status === 'OPEN').length,
        closed: prMetrics.filter((m) => m.status === 'CLOSED').length,
        merged: prMetrics.filter((m) => m.status === 'MERGED').length,
        engineers: engineerCount,
      },
      averages: {
        mergeTimeHours: averageOf(prMetrics.map((m) => m.mergeTimeHours)),
        timeToFirstReviewHours: averageOf(prMetrics.map((m) => m.timeToFirstReviewHours)),
        reviewTurnaroundHours: averageOf(prMetrics.map((m) => m.reviewTurnaroundHours)),
        reviewParticipationRate: averageOf(prMetrics.map((m) => m.reviewParticipationRate)),
      },
      codeVolume: {
        additions: sum(prMetrics.map((m) => m.linesAdded)),
        deletions: sum(prMetrics.map((m) => m.linesDeleted)),
        churn: sum(prMetrics.map((m) => m.codeChurn)),
      },
    };
  }
}

/** Average over the defined (non-null) values, rounded; null if none. */
function averageOf(values: Array<number | null>): number | null {
  const defined = values.filter((value): value is number => value !== null);
  return defined.length > 0 ? roundTo(sum(defined) / defined.length) : null;
}

// --- Mapping: stored rows → plain calculator inputs ---

function toPullRequestRecord(pr: PullRequestWithRelations): PullRequestRecord {
  return {
    id: pr.id,
    number: pr.number,
    authorId: pr.authorId,
    status: pr.status,
    additions: pr.additions,
    deletions: pr.deletions,
    changedFiles: pr.changedFiles,
    commentCount: pr.commentCount,
    createdAt: pr.createdAt,
    mergedAt: pr.mergedAt,
    firstReviewAt: pr.firstReviewAt,
    reviews: pr.reviews.map((review) => ({
      reviewerId: review.reviewerId,
      state: review.state,
      submittedAt: review.submittedAt,
    })),
    requestedReviewerIds: pr.requestedReviewers.map((engineer) => engineer.id),
  };
}

/**
 * Pivots PR-centric records into per-engineer inputs: each engineer's authored
 * PRs and the reviews they submitted (with PR context attached).
 */
function buildEngineerInputs(records: PullRequestRecord[]): EngineerInput[] {
  const byEngineer = new Map<
    string,
    { authored: PullRequestRecord[]; reviews: EngineerReviewRecord[] }
  >();

  const bucket = (engineerId: string) => {
    let entry = byEngineer.get(engineerId);
    if (!entry) {
      entry = { authored: [], reviews: [] };
      byEngineer.set(engineerId, entry);
    }
    return entry;
  };

  for (const record of records) {
    if (record.authorId) {
      bucket(record.authorId).authored.push(record);
    }
    for (const review of record.reviews) {
      bucket(review.reviewerId).reviews.push({
        pullRequestId: record.id,
        pullRequestAuthorId: record.authorId,
        pullRequestCreatedAt: record.createdAt,
        submittedAt: review.submittedAt,
        state: review.state,
      });
    }
  }

  return Array.from(byEngineer.entries()).map(([engineerId, entry]) => ({
    engineerId,
    authoredPullRequests: entry.authored,
    reviewsCompleted: entry.reviews,
    totalScopePullRequests: records.length,
  }));
}
