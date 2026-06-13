import { cn } from '../../utils/cn';

/** Color per GitHub file-change status, mirroring the StatusBadge pill style. */
const STATUS_STYLES: Record<string, string> = {
  added: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  removed: 'bg-rose-50 text-rose-700 ring-rose-200',
  modified: 'bg-amber-50 text-amber-700 ring-amber-200',
  changed: 'bg-amber-50 text-amber-700 ring-amber-200',
  renamed: 'bg-violet-50 text-violet-700 ring-violet-200',
  copied: 'bg-blue-50 text-blue-700 ring-blue-200',
};

const DEFAULT_STYLE = 'bg-slate-100 text-slate-600 ring-slate-200';

export function FileStatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status.toLowerCase()] ?? DEFAULT_STYLE;
  const label = status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        style,
      )}
    >
      {label}
    </span>
  );
}
