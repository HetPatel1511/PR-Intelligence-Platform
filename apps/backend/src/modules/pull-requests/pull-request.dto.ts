import { Prisma } from '@prisma/client';
import { z } from 'zod';

import { paginationSchema } from '../../utils/pagination.js';
import { toEngineerRef, type EngineerRefDto } from '../engineers/engineer.dto.js';

// --- Request validation ---

export const listPullRequestsQuery = paginationSchema.extend({
  status: z.enum(['OPEN', 'CLOSED', 'MERGED']).optional(),
  authorId: z.string().min(1).optional(),
  search: z.string().trim().min(1).optional(),
  sortBy: z.enum(['number', 'createdAt', 'mergedAt', 'updatedAt']).default('number'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type ListPullRequestsQuery = z.infer<typeof listPullRequestsQuery>;

export const pullRequestParams = z.object({ id: z.string().min(1) });
export type PullRequestParams = z.infer<typeof pullRequestParams>;

// --- Prisma include shapes + inferred row types (shared with the query service) ---

export const pullRequestListInclude = {
  author: true,
  _count: { select: { reviews: true, comments: true, files: true, commits: true } },
} satisfies Prisma.PullRequestInclude;
export type PullRequestListRow = Prisma.PullRequestGetPayload<{
  include: typeof pullRequestListInclude;
}>;

export const pullRequestDetailInclude = {
  author: true,
  reviews: { include: { reviewer: true }, orderBy: { submittedAt: 'asc' } },
  comments: { include: { author: true }, orderBy: { createdAt: 'asc' } },
  commits: { include: { author: true }, orderBy: { authoredAt: 'asc' } },
  files: { orderBy: { filename: 'asc' } },
  requestedReviewers: true,
  repository: { select: { connectedById: true } },
} satisfies Prisma.PullRequestInclude;
export type PullRequestDetailRow = Prisma.PullRequestGetPayload<{
  include: typeof pullRequestDetailInclude;
}>;

// --- Response DTOs ---

export interface PullRequestSummaryDto {
  id: string;
  number: number;
  title: string;
  status: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  firstReviewAt: string | null;
  author: EngineerRefDto | null;
  counts: { reviews: number; comments: number; files: number; commits: number };
}

export function toPullRequestSummaryDto(pr: PullRequestListRow): PullRequestSummaryDto {
  return {
    id: pr.id,
    number: pr.number,
    title: pr.title,
    status: pr.status,
    additions: pr.additions,
    deletions: pr.deletions,
    changedFiles: pr.changedFiles,
    commentCount: pr.commentCount,
    createdAt: pr.createdAt.toISOString(),
    updatedAt: pr.updatedAt.toISOString(),
    mergedAt: pr.mergedAt?.toISOString() ?? null,
    closedAt: pr.closedAt?.toISOString() ?? null,
    firstReviewAt: pr.firstReviewAt?.toISOString() ?? null,
    author: pr.author ? toEngineerRef(pr.author) : null,
    counts: {
      reviews: pr._count.reviews,
      comments: pr._count.comments,
      files: pr._count.files,
      commits: pr._count.commits,
    },
  };
}

export interface PullRequestDetailDto {
  id: string;
  number: number;
  title: string;
  status: string;
  additions: number;
  deletions: number;
  changedFiles: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  firstReviewAt: string | null;
  author: EngineerRefDto | null;
  reviews: Array<{
    id: string;
    state: string;
    submittedAt: string | null;
    reviewer: EngineerRefDto;
  }>;
  comments: Array<{
    id: string;
    body: string | null;
    path: string | null;
    line: number | null;
    createdAt: string;
    author: EngineerRefDto;
  }>;
  commits: Array<{
    id: string;
    sha: string;
    message: string;
    authoredAt: string | null;
    author: EngineerRefDto | null;
  }>;
  files: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
    changes: number;
  }>;
  requestedReviewers: EngineerRefDto[];
}

export function toPullRequestDetailDto(pr: PullRequestDetailRow): PullRequestDetailDto {
  return {
    id: pr.id,
    number: pr.number,
    title: pr.title,
    status: pr.status,
    additions: pr.additions,
    deletions: pr.deletions,
    changedFiles: pr.changedFiles,
    commentCount: pr.commentCount,
    createdAt: pr.createdAt.toISOString(),
    updatedAt: pr.updatedAt.toISOString(),
    mergedAt: pr.mergedAt?.toISOString() ?? null,
    closedAt: pr.closedAt?.toISOString() ?? null,
    firstReviewAt: pr.firstReviewAt?.toISOString() ?? null,
    author: pr.author ? toEngineerRef(pr.author) : null,
    reviews: pr.reviews.map((review) => ({
      id: review.id,
      state: review.state,
      submittedAt: review.submittedAt?.toISOString() ?? null,
      reviewer: toEngineerRef(review.reviewer),
    })),
    comments: pr.comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      path: comment.path,
      line: comment.line,
      createdAt: comment.createdAt.toISOString(),
      author: toEngineerRef(comment.author),
    })),
    commits: pr.commits.map((commit) => ({
      id: commit.id,
      sha: commit.sha,
      message: commit.message,
      authoredAt: commit.authoredAt?.toISOString() ?? null,
      author: commit.author ? toEngineerRef(commit.author) : null,
    })),
    files: pr.files.map((file) => ({
      filename: file.filename,
      status: file.status,
      additions: file.additions,
      deletions: file.deletions,
      changes: file.changes,
    })),
    requestedReviewers: pr.requestedReviewers.map(toEngineerRef),
  };
}
