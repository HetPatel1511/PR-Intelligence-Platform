/** Display formatters. Pure, null-safe — return an em dash for missing values. */

const EMPTY = '—';

/** Human-friendly duration from a number of hours. */
export function formatHours(hours: number | null | undefined): string {
  if (hours == null) return EMPTY;
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${roundOne(hours)}h`;
  return `${roundOne(hours / 24)}d`;
}

export function formatNumber(value: number | null | undefined): string {
  if (value == null) return EMPTY;
  return value.toLocaleString();
}

/** A 0–1 rate as a percentage. */
export function formatPercent(rate: number | null | undefined): string {
  if (rate == null) return EMPTY;
  return `${Math.round(rate * 100)}%`;
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return EMPTY;
  return new Date(iso).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return EMPTY;
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function displayName(person: { name: string | null; login: string }): string {
  return person.name ?? person.login;
}

function roundOne(value: number): number {
  return Math.round(value * 10) / 10;
}
