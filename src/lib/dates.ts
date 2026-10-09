// Local calendar dates as "YYYY-MM-DD" strings. Streaks and SRS use the
// learner's local day, not UTC.

export function toLocalDate(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parse(date: string): Date {
  const [y = 1970, m = 1, d = 1] = date.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: string, days: number): string {
  const d = parse(date);
  d.setDate(d.getDate() + days);
  return toLocalDate(d);
}

/** Whole days from a to b (b − a). */
export function daysBetween(a: string, b: string): number {
  return Math.round((parse(b).getTime() - parse(a).getTime()) / 86_400_000);
}

export function lastNDays(n: number, today = toLocalDate()): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - n + 1));
}
