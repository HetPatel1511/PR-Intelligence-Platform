import type { IGitHubClient } from '../../lib/github/github-client.js';
import type {
  GitHubAccount,
  GitHubCommit,
  GitHubFile,
  GitHubPullRequestDetail,
  GitHubRepo,
  GitHubReview,
  GitHubReviewComment,
} from '../../lib/github/github.types.js';
import type {
  CommitDTO,
  EngineerDTO,
  FileDTO,
  PullRequestDTO,
  PullRequestStatus,
  RepositoryDTO,
  ReviewCommentDTO,
  ReviewDTO,
} from './github.dto.js';

/**
 * Service abstraction the persistence layer depends on. Wraps an
 * `IGitHubClient` and maps raw GitHub responses into domain DTOs, so callers
 * never deal with GitHub's wire format. Injecting `IGitHubClient` keeps this
 * testable with a fake.
 */
export interface IGitHubService {
  listRepositories(): Promise<RepositoryDTO[]>;
  listPullRequestNumbers(owner: string, repo: string): Promise<number[]>;
  getPullRequest(owner: string, repo: string, number: number): Promise<PullRequestDTO>;
  listReviews(owner: string, repo: string, number: number): Promise<ReviewDTO[]>;
  listReviewComments(owner: string, repo: string, number: number): Promise<ReviewCommentDTO[]>;
  listRequestedReviewers(owner: string, repo: string, number: number): Promise<EngineerDTO[]>;
  listCommits(owner: string, repo: string, number: number): Promise<CommitDTO[]>;
  listFiles(owner: string, repo: string, number: number): Promise<FileDTO[]>;
}

export class GitHubService implements IGitHubService {
  constructor(private readonly client: IGitHubClient) {}

  async listRepositories(): Promise<RepositoryDTO[]> {
    const repos = await this.client.listUserRepositories();
    return repos.map(mapRepository);
  }

  async listPullRequestNumbers(owner: string, repo: string): Promise<number[]> {
    const prs = await this.client.listPullRequests(owner, repo);
    return prs.map((pr) => pr.number);
  }

  async getPullRequest(owner: string, repo: string, number: number): Promise<PullRequestDTO> {
    const pr = await this.client.getPullRequest(owner, repo, number);
    return mapPullRequest(pr);
  }

  async listReviews(owner: string, repo: string, number: number): Promise<ReviewDTO[]> {
    const reviews = await this.client.listReviews(owner, repo, number);
    return reviews.map(mapReview);
  }

  async listReviewComments(
    owner: string,
    repo: string,
    number: number,
  ): Promise<ReviewCommentDTO[]> {
    const comments = await this.client.listReviewComments(owner, repo, number);
    return comments.map(mapReviewComment);
  }

  async listRequestedReviewers(
    owner: string,
    repo: string,
    number: number,
  ): Promise<EngineerDTO[]> {
    const users = await this.client.listRequestedReviewers(owner, repo, number);
    return users.map(mapEngineer);
  }

  async listCommits(owner: string, repo: string, number: number): Promise<CommitDTO[]> {
    const commits = await this.client.listCommits(owner, repo, number);
    return commits.map(mapCommit);
  }

  async listFiles(owner: string, repo: string, number: number): Promise<FileDTO[]> {
    const files = await this.client.listFiles(owner, repo, number);
    return files.map(mapFile);
  }
}

// --- Mappers (raw GitHub → domain DTO) ---

const toDate = (value: string | null | undefined): Date | null => (value ? new Date(value) : null);

function deriveStatus(pr: {
  state: 'open' | 'closed';
  merged_at: string | null;
}): PullRequestStatus {
  if (pr.merged_at) return 'MERGED';
  return pr.state === 'closed' ? 'CLOSED' : 'OPEN';
}

function mapEngineer(account: GitHubAccount): EngineerDTO {
  return {
    githubId: BigInt(account.id),
    login: account.login,
    name: account.name ?? null,
    avatarUrl: account.avatar_url ?? null,
  };
}

const mapEngineerOrNull = (account: GitHubAccount | null): EngineerDTO | null =>
  account ? mapEngineer(account) : null;

function mapRepository(repo: GitHubRepo): RepositoryDTO {
  return {
    githubId: BigInt(repo.id),
    owner: repo.owner.login,
    name: repo.name,
    fullName: repo.full_name,
    isPrivate: repo.private,
  };
}

function mapPullRequest(pr: GitHubPullRequestDetail): PullRequestDTO {
  return {
    githubId: BigInt(pr.id),
    number: pr.number,
    title: pr.title,
    status: deriveStatus(pr),
    additions: pr.additions,
    deletions: pr.deletions,
    changedFiles: pr.changed_files,
    commentCount: pr.comments + pr.review_comments,
    createdAt: new Date(pr.created_at),
    updatedAt: new Date(pr.updated_at),
    mergedAt: toDate(pr.merged_at),
    closedAt: toDate(pr.closed_at),
    author: mapEngineerOrNull(pr.user),
  };
}

function mapReview(review: GitHubReview): ReviewDTO {
  return {
    githubId: BigInt(review.id),
    state: review.state,
    submittedAt: toDate(review.submitted_at),
    reviewer: mapEngineerOrNull(review.user),
  };
}

function mapReviewComment(comment: GitHubReviewComment): ReviewCommentDTO {
  return {
    githubId: BigInt(comment.id),
    body: comment.body,
    path: comment.path,
    line: comment.line,
    createdAt: new Date(comment.created_at),
    author: mapEngineerOrNull(comment.user),
  };
}

function mapCommit(commit: GitHubCommit): CommitDTO {
  return {
    sha: commit.sha,
    message: commit.commit.message,
    authoredAt: toDate(commit.commit.author?.date),
    author: mapEngineerOrNull(commit.author),
  };
}

function mapFile(file: GitHubFile): FileDTO {
  return {
    filename: file.filename,
    status: file.status,
    additions: file.additions,
    deletions: file.deletions,
    changes: file.changes,
  };
}
