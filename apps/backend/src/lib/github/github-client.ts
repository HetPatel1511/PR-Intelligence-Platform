import axios, {
  AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type AxiosResponse,
} from 'axios';

import { HttpError } from '../../utils/http-error.js';
import type {
  GitHubAccount,
  GitHubCommit,
  GitHubFile,
  GitHubPullRequestDetail,
  GitHubPullRequestSummary,
  GitHubRepo,
  GitHubRequestedReviewers,
  GitHubReview,
  GitHubReviewComment,
} from './github.types.js';

/**
 * Abstraction over the raw GitHub REST API. Depending on this interface (rather
 * than the concrete client) lets services be unit-tested with a fake and keeps
 * HTTP concerns out of the domain layer.
 */
export interface IGitHubClient {
  listUserRepositories(): Promise<GitHubRepo[]>;
  listPullRequests(owner: string, repo: string): Promise<GitHubPullRequestSummary[]>;
  getPullRequest(owner: string, repo: string, number: number): Promise<GitHubPullRequestDetail>;
  listReviews(owner: string, repo: string, number: number): Promise<GitHubReview[]>;
  listReviewComments(owner: string, repo: string, number: number): Promise<GitHubReviewComment[]>;
  listRequestedReviewers(owner: string, repo: string, number: number): Promise<GitHubAccount[]>;
  listCommits(owner: string, repo: string, number: number): Promise<GitHubCommit[]>;
  listFiles(owner: string, repo: string, number: number): Promise<GitHubFile[]>;
}

export interface GitHubClientOptions {
  /** GitHub access token (already decrypted by the caller). */
  token: string;
  baseUrl?: string;
  /** Retries for transient failures and rate-limit waits. Default 3. */
  maxRetries?: number;
  /** Items per page for list endpoints. Default 100 (GitHub max). */
  perPage?: number;
  /** Longest we'll block waiting for a rate-limit reset. Default 60s. */
  maxRateLimitWaitMs?: number;
  userAgent?: string;
}

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Low-level GitHub REST client. Responsibilities: auth, Link-header pagination,
 * rate-limit waiting, retry with exponential backoff, and mapping HTTP failures
 * to `HttpError`. Returns raw GitHub shapes — mapping happens one layer up.
 */
export class GitHubClient implements IGitHubClient {
  private readonly http: AxiosInstance;
  private readonly maxRetries: number;
  private readonly perPage: number;
  private readonly maxRateLimitWaitMs: number;

  constructor(options: GitHubClientOptions) {
    this.maxRetries = options.maxRetries ?? 3;
    this.perPage = options.perPage ?? 100;
    this.maxRateLimitWaitMs = options.maxRateLimitWaitMs ?? 60_000;

    this.http = axios.create({
      baseURL: options.baseUrl ?? 'https://api.github.com',
      timeout: 30_000,
      headers: {
        Authorization: `Bearer ${options.token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': options.userAgent ?? 'pr-intelligence-platform',
      },
    });
  }

  // --- Public API ---

  listUserRepositories(): Promise<GitHubRepo[]> {
    return this.paginate<GitHubRepo>('/user/repos', {
      affiliation: 'owner,collaborator,organization_member',
      sort: 'updated',
    });
  }

  listPullRequests(owner: string, repo: string): Promise<GitHubPullRequestSummary[]> {
    return this.paginate<GitHubPullRequestSummary>(`/repos/${owner}/${repo}/pulls`, {
      state: 'all',
      sort: 'created',
      direction: 'asc',
    });
  }

  async getPullRequest(
    owner: string,
    repo: string,
    number: number,
  ): Promise<GitHubPullRequestDetail> {
    const res = await this.request<GitHubPullRequestDetail>({
      method: 'GET',
      url: `/repos/${owner}/${repo}/pulls/${number}`,
    });
    return res.data;
  }

  listReviews(owner: string, repo: string, number: number): Promise<GitHubReview[]> {
    return this.paginate<GitHubReview>(`/repos/${owner}/${repo}/pulls/${number}/reviews`);
  }

  listReviewComments(owner: string, repo: string, number: number): Promise<GitHubReviewComment[]> {
    return this.paginate<GitHubReviewComment>(`/repos/${owner}/${repo}/pulls/${number}/comments`);
  }

  async listRequestedReviewers(
    owner: string,
    repo: string,
    number: number,
  ): Promise<GitHubAccount[]> {
    // This endpoint returns an object `{ users, teams }`, not a list.
    const res = await this.request<GitHubRequestedReviewers>({
      method: 'GET',
      url: `/repos/${owner}/${repo}/pulls/${number}/requested_reviewers`,
    });
    return res.data.users;
  }

  listCommits(owner: string, repo: string, number: number): Promise<GitHubCommit[]> {
    return this.paginate<GitHubCommit>(`/repos/${owner}/${repo}/pulls/${number}/commits`);
  }

  listFiles(owner: string, repo: string, number: number): Promise<GitHubFile[]> {
    return this.paginate<GitHubFile>(`/repos/${owner}/${repo}/pulls/${number}/files`);
  }

  // --- Internals ---

  /** Follows `Link: rel="next"` until exhausted, accumulating all pages. */
  private async paginate<T>(path: string, params?: Record<string, string>): Promise<T[]> {
    const items: T[] = [];
    let config: AxiosRequestConfig = {
      method: 'GET',
      url: path,
      params: { per_page: this.perPage, ...params },
    };

    for (;;) {
      const res = await this.request<T[]>(config);
      items.push(...res.data);

      const next = this.parseNextLink(res.headers['link'] as string | undefined);
      if (!next) break;

      // The next URL is absolute and already carries pagination params.
      config = { method: 'GET', url: next };
    }

    return items;
  }

  /**
   * Single request with rate-limit waiting and bounded retries. Distinguishes
   * rate limiting (wait for reset) from transient errors (exponential backoff).
   */
  private async request<T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    let attempt = 0;

    for (;;) {
      try {
        return await this.http.request<T>(config);
      } catch (err) {
        const axiosErr = err as AxiosError;
        const res = axiosErr.response;

        if (res && (res.status === 403 || res.status === 429) && this.isRateLimited(res)) {
          const waitMs = this.rateLimitWaitMs(res);
          if (attempt < this.maxRetries && waitMs <= this.maxRateLimitWaitMs) {
            attempt += 1;
            await sleep(waitMs);
            continue;
          }
          throw new HttpError(429, 'GitHub rate limit exceeded; try again later');
        }

        if (this.isRetryable(axiosErr) && attempt < this.maxRetries) {
          attempt += 1;
          await sleep(this.backoffMs(attempt));
          continue;
        }

        throw this.toHttpError(axiosErr);
      }
    }
  }

  /** Extracts the `rel="next"` URL from a GitHub `Link` header, if any. */
  private parseNextLink(linkHeader: string | undefined): string | null {
    if (!linkHeader) return null;

    for (const segment of linkHeader.split(',')) {
      const match = segment.match(/<([^>]+)>;\s*rel="next"/);
      if (match) return match[1] ?? null;
    }
    return null;
  }

  private isRateLimited(res: AxiosResponse): boolean {
    return res.headers['x-ratelimit-remaining'] === '0' || res.headers['retry-after'] !== undefined;
  }

  private rateLimitWaitMs(res: AxiosResponse): number {
    const retryAfter = res.headers['retry-after'];
    if (retryAfter !== undefined) {
      return Number(retryAfter) * 1000;
    }
    const reset = res.headers['x-ratelimit-reset'];
    if (reset !== undefined) {
      // `reset` is a UTC epoch in seconds; add a 1s buffer past it.
      return Math.max(0, Number(reset) * 1000 - Date.now()) + 1000;
    }
    return 1000;
  }

  private isRetryable(err: AxiosError): boolean {
    // No response → network/timeout. 5xx → server-side transient.
    return !err.response || err.response.status >= 500;
  }

  private backoffMs(attempt: number): number {
    const base = 500 * 2 ** (attempt - 1);
    return base + Math.floor(Math.random() * 250); // jitter
  }

  private toHttpError(err: AxiosError): HttpError {
    const status = err.response?.status;
    const message = (err.response?.data as { message?: string } | undefined)?.message;

    switch (status) {
      case 401:
        return HttpError.unauthorized('GitHub authentication failed');
      case 403:
        return HttpError.forbidden(message ?? 'GitHub access forbidden');
      case 404:
        return HttpError.notFound(message ?? 'GitHub resource not found');
      default:
        return HttpError.badGateway(`GitHub request failed: ${message ?? err.message}`);
    }
  }
}
