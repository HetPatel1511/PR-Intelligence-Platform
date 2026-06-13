/**
 * Domain DTOs the persistence services consume. Decoupled from GitHub's JSON:
 * dates are real `Date`s, ids are `bigint`, and status is our enum. Mapping from
 * raw GitHub shapes lives in `GitHubService`.
 */

export type PullRequestStatus = 'OPEN' | 'CLOSED' | 'MERGED';

export type ReviewState = 'APPROVED' | 'CHANGES_REQUESTED' | 'COMMENTED' | 'DISMISSED' | 'PENDING';

export interface EngineerDTO {
  githubId: bigint;
  login: string;
  name: string | null;
  avatarUrl: string | null;
}

export interface RepositoryDTO {
  githubId: bigint;
  owner: string;
  name: string;
  fullName: string;
  isPrivate: boolean;
}

export interface PullRequestDTO {
  githubId: bigint;
  number: number;
  title: string;
  status: PullRequestStatus;
  additions: number;
  deletions: number;
  changedFiles: number;
  commentCount: number;
  createdAt: Date;
  updatedAt: Date;
  mergedAt: Date | null;
  closedAt: Date | null;
  author: EngineerDTO | null;
}

export interface ReviewDTO {
  githubId: bigint;
  state: ReviewState;
  submittedAt: Date | null;
  reviewer: EngineerDTO | null;
}

export interface ReviewCommentDTO {
  githubId: bigint;
  body: string | null;
  path: string | null;
  line: number | null;
  createdAt: Date;
  author: EngineerDTO | null;
}

export interface CommitDTO {
  sha: string;
  message: string;
  authoredAt: Date | null;
  author: EngineerDTO | null;
}

export interface FileDTO {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
}
