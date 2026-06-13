/**
 * TypeScript mirrors of the backend response DTOs. Single source of truth for
 * the shapes the API abstraction layer returns.
 */

export interface SafeUser {
  id: string;
  githubId: string;
  login: string;
  name: string | null;
  email: string | null;
  avatarUrl: string | null;
}

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: Pagination;
}

export interface Repository {
  id: string;
  githubId: string;
  owner: string;
  name: string;
  fullName: string;
  isPrivate: boolean;
  lastSyncedAt: string | null;
  createdAt: string;
}

export type PullRequestStatus = 'OPEN' | 'CLOSED' | 'MERGED';

export interface EngineerRef {
  id: string;
  githubId: string;
  login: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface PullRequestSummary {
  id: string;
  number: number;
  title: string;
  status: PullRequestStatus;
  additions: number;
  deletions: number;
  changedFiles: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  firstReviewAt: string | null;
  author: EngineerRef | null;
  counts: { reviews: number; comments: number; files: number; commits: number };
}

export interface PullRequestMetrics {
  pullRequestId: string;
  number: number;
  status: PullRequestStatus;
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

export interface ReviewItem {
  id: string;
  state: string;
  submittedAt: string | null;
  reviewer: EngineerRef;
}

export interface CommentItem {
  id: string;
  body: string | null;
  path: string | null;
  line: number | null;
  createdAt: string;
  author: EngineerRef;
}

export interface CommitItem {
  id: string;
  sha: string;
  message: string;
  authoredAt: string | null;
  author: EngineerRef | null;
}

export interface FileItem {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
}

export interface PullRequestDetail {
  id: string;
  number: number;
  title: string;
  status: PullRequestStatus;
  additions: number;
  deletions: number;
  changedFiles: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  firstReviewAt: string | null;
  author: EngineerRef | null;
  reviews: ReviewItem[];
  comments: CommentItem[];
  commits: CommitItem[];
  files: FileItem[];
  requestedReviewers: EngineerRef[];
  metrics: PullRequestMetrics;
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

export interface EngineerWithMetrics extends EngineerRef {
  metrics: EngineerMetrics | null;
}

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

export interface SyncResult {
  repositoryId: string;
  totalPullRequests: number;
  synced: number;
  failures: Array<{ number: number; error: string }>;
}
