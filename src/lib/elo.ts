// Adaptive difficulty: Elo ratings for learners and tasks on one scale.
// P(correct) follows the logistic (1PL IRT-style) curve used by Elo.

export const START_RATING = 1000;
export const TARGET_P = 0.7;

export function expectedScore(learner: number, task: number): number {
  return 1 / (1 + 10 ** ((task - learner) / 400));
}

/** K shrinks with experience: fast early calibration, stable later. */
export function kFactor(attempts: number): number {
  return Math.max(16, 48 / (1 + attempts / 15));
}

/**
 * Update a learner rating after one task.
 * `result` is 1 (correct), 0.5 (correct after a hint) or 0 (wrong).
 */
export function updateRating(learner: number, task: number, result: number, attempts: number): number {
  const k = kFactor(attempts);
  return Math.round(learner + k * (result - expectedScore(learner, task)));
}

export interface Rated {
  id: string;
  rating: number;
}

/**
 * Choose the task whose success probability is closest to `target`.
 * Recently seen tasks are skipped unless nothing else is left.
 */
export function selectNext<T extends Rated>(
  pool: readonly T[],
  learner: number,
  recent: ReadonlySet<string> = new Set(),
  target = TARGET_P,
): T | undefined {
  const fresh = pool.filter((t) => !recent.has(t.id));
  const candidates = fresh.length ? fresh : pool;
  let best: T | undefined;
  let bestGap = Infinity;
  for (const t of candidates) {
    const gap = Math.abs(expectedScore(learner, t.rating) - target);
    if (gap < bestGap || (gap === bestGap && best && t.id < best.id)) {
      best = t;
      bestGap = gap;
    }
  }
  return best;
}
