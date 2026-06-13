/**
 * Pure per-engineer metric functions, aggregating the engineer's authored PRs
 * and completed reviews. `computeEngineerMetrics` composes them.
 */
import type {
  EngineerInput,
  EngineerMetrics,
  EngineerReviewRecord,
  PullRequestRecord,
} from '../metrics.types.js';
import { average, hoursBetween, roundTo, sum } from './aggregate.js';

export function pullRequestsMerged(authored: PullRequestRecord[]): number {
  return authored.filter((pr) => pr.status === 'MERGED').length;
}

/** Mean merge time across the engineer's merged PRs. */
export function averageMergeTimeHours(authored: PullRequestRecord[]): number | null {
  const times = authored
    .filter((pr): pr is PullRequestRecord & { mergedAt: Date } => pr.mergedAt !== null)
    .map((pr) => hoursBetween(pr.createdAt, pr.mergedAt));

  const avg = average(times);
  return avg === null ? null : roundTo(avg);
}

/** Mean time from PR creation to this engineer's review (reviewer responsiveness). */
export function averageReviewTimeHours(reviews: EngineerReviewRecord[]): number | null {
  const times = submittedReviews(reviews).map((review) =>
    hoursBetween(review.pullRequestCreatedAt, review.submittedAt),
  );

  const avg = average(times);
  return avg === null ? null : roundTo(avg);
}

export function reviewsCompleted(reviews: EngineerReviewRecord[]): number {
  return submittedReviews(reviews).length;
}

export function distinctPullRequestsReviewed(reviews: EngineerReviewRecord[]): number {
  return new Set(submittedReviews(reviews).map((review) => review.pullRequestId)).size;
}

/**
 * Of the PRs the engineer *could* have reviewed (every PR in scope they didn't
 * author), the fraction they actually reviewed. Null when there is nothing to
 * review.
 */
export function reviewParticipationRate(
  engineerId: string,
  reviews: EngineerReviewRecord[],
  totalScopePullRequests: number,
  authoredCount: number,
): number | null {
  const reviewable = totalScopePullRequests - authoredCount;
  if (reviewable <= 0) return null;

  const distinct = new Set(
    submittedReviews(reviews)
      .filter((review) => review.pullRequestAuthorId !== engineerId)
      .map((review) => review.pullRequestId),
  ).size;

  return roundTo(distinct / reviewable);
}

export function computeEngineerMetrics(input: EngineerInput): EngineerMetrics {
  const {
    engineerId,
    authoredPullRequests,
    reviewsCompleted: reviews,
    totalScopePullRequests,
  } = input;

  return {
    engineerId,
    totalPullRequestsOpened: authoredPullRequests.length,
    pullRequestsMerged: pullRequestsMerged(authoredPullRequests),
    averageMergeTimeHours: averageMergeTimeHours(authoredPullRequests),
    averageReviewTimeHours: averageReviewTimeHours(reviews),
    reviewsCompleted: reviewsCompleted(reviews),
    distinctPullRequestsReviewed: distinctPullRequestsReviewed(reviews),
    reviewParticipationRate: reviewParticipationRate(
      engineerId,
      reviews,
      totalScopePullRequests,
      authoredPullRequests.length,
    ),
    totalCodeAdded: sum(authoredPullRequests.map((pr) => pr.additions)),
    totalCodeRemoved: sum(authoredPullRequests.map((pr) => pr.deletions)),
  };
}

/** Reviews that were actually submitted (narrowed so `submittedAt` is non-null). */
function submittedReviews(
  reviews: EngineerReviewRecord[],
): Array<EngineerReviewRecord & { submittedAt: Date }> {
  return reviews.filter(
    (review): review is EngineerReviewRecord & { submittedAt: Date } => review.submittedAt !== null,
  );
}
