import type { PullRequestStatus } from '../../types/api';
import { cn } from '../../utils/cn';

const STATUS_STYLES: Record<PullRequestStatus, string> = {
  OPEN: 'bg-blue-50 text-blue-700 ring-blue-200',
  MERGED: 'bg-violet-50 text-violet-700 ring-violet-200',
  CLOSED: 'bg-slate-100 text-slate-600 ring-slate-200',
};

const STATUS_LABELS: Record<PullRequestStatus, string> = {
  OPEN: 'Open',
  MERGED: 'Merged',
  CLOSED: 'Closed',
};

export function StatusBadge({ status }: { status: PullRequestStatus }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        STATUS_STYLES[status],
      )}
    >
      {STATUS_LABELS[status]}
    </span>
  );
}
