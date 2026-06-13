import { useEffect, useRef } from 'react';

/** Auto-sync only if the last sync is at least this old. */
const STALE_AFTER_MS = 5 * 60 * 1000; // 5 minutes

function isStale(lastSyncedAt: string | number | null): boolean {
  if (lastSyncedAt == null) return true; // never synced
  const time = typeof lastSyncedAt === 'string' ? new Date(lastSyncedAt).getTime() : lastSyncedAt;
  if (Number.isNaN(time)) return true;
  return Date.now() - time >= STALE_AFTER_MS;
}

/** True when this document load was a browser reload (vs. SPA navigation). */
function isBrowserReload(): boolean {
  const [nav] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
  return nav?.type === 'reload';
}

/**
 * A browser reload re-evaluates this module, so this captures "the page was
 * refreshed". It forces the first auto-sync regardless of staleness, then is
 * consumed so later in-app navigation still respects the window.
 */
let forceSyncOnReload = isBrowserReload();

interface AutoSyncOptions {
  /** Re-evaluated when this changes (e.g. the repository id). */
  key?: string;
  /**
   * Timestamp of the last sync. `undefined` means "not loaded yet" (wait);
   * `null` means "never synced" (sync now); otherwise sync only when older than
   * the staleness window.
   */
  lastSyncedAt: string | number | null | undefined;
}

/**
 * Fires `trigger` when a page opens, but only if the last sync is stale (older
 * than {@link STALE_AFTER_MS}) — so reopening within the window won't re-sync.
 * The ref guard keeps it to one decision per key (StrictMode-safe). Pass a
 * stable `trigger` such as a React Query `mutate`.
 */
export function useAutoSync(
  trigger: () => void,
  { key = '__mount__', lastSyncedAt }: AutoSyncOptions,
): void {
  const handledKey = useRef<string | null>(null);

  useEffect(() => {
    if (lastSyncedAt === undefined) return; // last-sync time not known yet
    if (handledKey.current === key) return; // already decided for this key
    handledKey.current = key;

    // A browser refresh always re-syncs; otherwise only when stale.
    const forced = forceSyncOnReload;
    forceSyncOnReload = false; // consume — applies to the reloaded page only
    if (forced || isStale(lastSyncedAt)) trigger();
  }, [key, lastSyncedAt, trigger]);
}
