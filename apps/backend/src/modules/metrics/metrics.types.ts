/**
 * Plain input/output shapes for the metrics engine. Deliberately decoupled from
 * Prisma models and GitHub DTOs: the calculators depend only on these, so they
 * stay pure and unit-testable, and a storage change only touches the mapping in
 * `MetricsService`.
 */

export type PullRequestStatusValue = 'OPEN' | 'CLOSED' | 'MERGED';

export type ReviewStateValue =
  | 'APPROVED'
  | 'CHANGES_REQUESTED'
  | 'COMMENTED'
  | 'DISMISSED'
  | 'PENDING';

// --- Inputs (mapped from stored rows) ---

export interface ReviewRecord {
  reviewerId: string;
  state: ReviewStateValue;
  submittedAt: Date | null;
}

export interface PullRequestRecord {
  id: string;
  number: number;
  authorId: string | null;
  status: PullRequestStatusValue;
  additions: number;
  deletions: number;
  changedFiles: number;
  commentCount: number;
  createdAt: Date;
  mergedAt: Date | null;
  firstReviewAt: Date | null;
  reviews: ReviewRecord[];
  /** Engineers with an outstanding (not-yet-fulfilled) review request. */
  requestedReviewerIds: string[];
}

/** A review by one engineer, carrying the context of the PR it belongs to. */
export interface EngineerReviewRecord {
  pullRequestId: string;
  pullRequestAuthorId: string | null;
  pullRequestCreatedAt: Date;
  submittedAt: Date | null;
  state: ReviewStateValue;
}

export interface EngineerInput {
  engineerId: string;
  authoredPullRequests: PullRequestRecord[];
  reviewsCompleted: EngineerReviewRecord[];
  /** Total PRs in the scope being measured (used for participation rate). */
  totalScopePullRequests: number;
}

// --- Outputs ---

export interface PullRequestMetrics {
  pullRequestId: string;
  number: number;
  status: PullRequestStatusValue;
  mergeTimeHours: number | null;
  timeToFirstReviewHours: number | null;
  reviewTurnaroundHours: number | null;
  reviewerCount: number;
  commentCount: number;
  filesChanged: number;
  linesAdded: number;
  linesDeleted: number;
  codeChurn: number;
  reviewParticipationRate: number | null;
}

export interface EngineerMetrics {
  engineerId: string;
  totalPullRequestsOpened: number;
  pullRequestsMerged: number;
  averageMergeTimeHours: number | null;
  averageReviewTimeHours: number | null;
  reviewsCompleted: number;
  distinctPullRequestsReviewed: number;
  reviewParticipationRate: number | null;
  totalCodeAdded: number;
  totalCodeRemoved: number;
}

/** Repository-level rollup powering the dashboard cards/charts. */
export interface DashboardSummary {
  repositoryId: string;
  totals: {
    pullRequests: number;
    open: number;
    closed: number;
    merged: number;
    engineers: number;
  };
  averages: {
    mergeTimeHours: number | null;
    timeToFirstReviewHours: number | null;
    reviewTurnaroundHours: number | null;
    reviewParticipationRate: number | null;
  };
  codeVolume: {
    additions: number;
    deletions: number;
    churn: number;
  };
}
