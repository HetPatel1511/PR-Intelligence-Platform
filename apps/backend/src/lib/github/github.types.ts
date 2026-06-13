/**
 * Raw GitHub REST response shapes — only the fields we consume. These stay
 * inside the client/service layer; the rest of the app sees mapped domain DTOs.
 */

export interface GitHubAccount {
  id: number;
  login: string;
  name?: string | null;
  avatar_url?: string | null;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  owner: GitHubAccount;
}

/** PR as returned by the list endpoint (no diff stats). */
export interface GitHubPullRequestSummary {
  id: number;
  number: number;
  title: string;
  state: 'open' | 'closed';
  merged_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  user: GitHubAccount | null;
}

/** PR as returned by the single-PR endpoint (adds diff/comment stats). */
export interface GitHubPullRequestDetail extends GitHubPullRequestSummary {
  additions: number;
  deletions: number;
  changed_files: number;
  comments: number;
  review_comments: number;
}

export type GitHubReviewState =
  | 'APPROVED'
  | 'CHANGES_REQUESTED'
  | 'COMMENTED'
  | 'DISMISSED'
  | 'PENDING';

export interface GitHubReview {
  id: number;
  state: GitHubReviewState;
  submitted_at: string | null;
  user: GitHubAccount | null;
}

export interface GitHubReviewComment {
  id: number;
  body: string | null;
  path: string | null;
  line: number | null;
  created_at: string;
  user: GitHubAccount | null;
}

export interface GitHubRequestedReviewers {
  users: GitHubAccount[];
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: { date: string | null } | null;
  };
  author: GitHubAccount | null;
}

export interface GitHubFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
}
