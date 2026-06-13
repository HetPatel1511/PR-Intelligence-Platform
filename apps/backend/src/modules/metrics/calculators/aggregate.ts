/**
 * Small pure helpers shared by the metric calculators. No I/O, no side effects.
 */

const MS_PER_HOUR = 1000 * 60 * 60;

/** Whole hours (fractional) between two timestamps. */
export function hoursBetween(start: Date, end: Date): number {
  return (end.getTime() - start.getTime()) / MS_PER_HOUR;
}

export function roundTo(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

export function sum(values: number[]): number {
  return values.reduce((total, value) => total + value, 0);
}

/** Mean of the values, or `null` for an empty set (no meaningful average). */
export function average(values: number[]): number | null {
  return values.length > 0 ? sum(values) / values.length : null;
}
