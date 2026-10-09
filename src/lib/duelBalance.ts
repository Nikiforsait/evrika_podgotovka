// Keeps duels competitive: the opponent's per-task success chance follows the
// learner's own accuracy, nudged up after wins and down after losses, so nobody
// wins or loses all the time.

export const OPPONENT_MIN = 0.25;
export const OPPONENT_MAX = 0.9;
export const STEP_PER_RESULT = 0.05; // per net win/loss among recent duels
export const RECENT_DUELS = 5;
export const DEFAULT_ACCURACY = 0.6;

export type DuelOutcome = 'won' | 'lost' | 'draw';

/** Net balance of the last few duels: +1 per win, −1 per loss, draws ignored. */
export function recentBalance(outcomes: DuelOutcome[], recent = RECENT_DUELS): number {
  return outcomes.slice(-recent).reduce((s, o) => s + (o === 'won' ? 1 : o === 'lost' ? -1 : 0), 0);
}

/**
 * Chance that the opponent solves one task.
 * `accuracy` — learner's recent share of correct answers (0..1), `balance` — recentBalance().
 */
export function opponentProbability(accuracy: number | null, balance: number): number {
  const base = accuracy ?? DEFAULT_ACCURACY;
  return Math.min(OPPONENT_MAX, Math.max(OPPONENT_MIN, base + STEP_PER_RESULT * balance));
}

export type OpponentSkill = 'easier' | 'even' | 'harder';

/** Label for the UI: how the opponent compares with the learner. */
export function skillLabel(probability: number, accuracy: number | null): OpponentSkill {
  const base = accuracy ?? DEFAULT_ACCURACY;
  if (probability > base + 0.07) return 'harder';
  if (probability < base - 0.07) return 'easier';
  return 'even';
}
