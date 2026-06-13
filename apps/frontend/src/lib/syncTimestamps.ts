/**
 * Tracks when a client-side sync last ran, for actions without a server-side
 * timestamp (the repository-list refresh). Persisted so it survives reloads.
 */
const PREFIX = 'pr-intel:lastSync:';

export function recordSync(key: string): void {
  try {
    localStorage.setItem(PREFIX + key, String(Date.now()));
  } catch {
    // localStorage unavailable (private mode, etc.) — non-fatal.
  }
}

export function getLastSync(key: string): number | null {
  try {
    const value = localStorage.getItem(PREFIX + key);
    return value ? Number(value) : null;
  } catch {
    return null;
  }
}
