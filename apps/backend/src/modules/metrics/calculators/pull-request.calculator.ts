/**
 * Pure per-pull-request metric functions. Each is independently exported and
 * testable; `computePullRequestMetrics` composes them into the output shape.
 * To add a metric: write a function here and add its field in both places.
 */
import type { PullRequestMetrics, PullRequestRecord } from '../metrics.types.js';
import { hoursBetween, roundTo } from './aggregate.js';

/** Total lifecycle: open → merged. Null while unmerged. */
export function mergeTimeHours(pr: PullRequestRecord): number | null {
  return pr.mergedAt ? roundTo(hoursBetween(pr.createdAt, pr.mergedAt)) : null;
}

/** Responsiveness: open → first review. Null if never reviewed. */
export function timeToFirstReviewHours(pr: PullRequestRecord): number | null {
  return pr.firstReviewAt ? roundTo(hoursBetween(pr.createdAt, pr.firstReviewAt)) : null;
}

/** Iteration cycle: first review → merge. Null unless both happened. */
export function reviewTurnaroundHours(pr: PullRequestRecord): number | null {
  if (!pr.firstReviewAt || !pr.mergedAt) return null;
  return roundTo(hoursBetween(pr.firstReviewAt, pr.mergedAt));
}

/** Distinct engineers who actually submitted a review. */
export function reviewerCount(pr: PullRequestRecord): number {
  return submittedReviewerIds(pr).size;
}

export function codeChurn(pr: PullRequestRecord): number {
  return pr.additions + pr.deletions;
}

/**
 * Fraction of everyone asked to review who actually did. GitHub drops a user
 * from `requested_reviewers` once they review, so the people still pending plus
 * those who reviewed reconstruct the full set asked.
 */
export function reviewParticipationRate(pr: PullRequestRecord): number | null {
  const reviewers = submittedReviewerIds(pr);
  const pending = pr.requestedReviewerIds.filter((id) => !reviewers.has(id));
  const totalParticipants = reviewers.size + pending.length;

  return totalParticipants > 0 ? roundTo(reviewers.size / totalParticipants) : null;
}

export function computePullRequestMetrics(pr: PullRequestRecord): PullRequestMetrics {
  return {
    pullRequestId: pr.id,
    number: pr.number,
    status: pr.status,
    mergeTimeHours: mergeTimeHours(pr),
    timeToFirstReviewHours: timeToFirstReviewHours(pr),
    reviewTurnaroundHours: reviewTurnaroundHours(pr),
    reviewerCount: reviewerCount(pr),
    commentCount: pr.commentCount,
    filesChanged: pr.changedFiles,
    linesAdded: pr.additions,
    linesDeleted: pr.deletions,
    codeChurn: codeChurn(pr),
    reviewParticipationRate: reviewParticipationRate(pr),
  };
}

/** Distinct reviewer ids among reviews that were actually submitted. */
function submittedReviewerIds(pr: PullRequestRecord): Set<string> {
  return new Set(
    pr.reviews.filter((review) => review.submittedAt !== null).map((review) => review.reviewerId),
  );
}
