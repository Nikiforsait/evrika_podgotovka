// SM-2 spaced repetition for formula and algorithm cards.
import { addDays, toLocalDate } from './dates.ts';

export type Grade = 'again' | 'hard' | 'good' | 'easy';

export interface SrsState {
  ease: number; // easiness factor, >= 1.3
  interval: number; // days until the next review
  reps: number; // successful reviews in a row
  lapses: number;
  due: string; // local date "YYYY-MM-DD"
}

/** SM-2 quality score for each button. */
const QUALITY: Record<Grade, number> = { again: 1, hard: 3, good: 4, easy: 5 };
export const MIN_EASE = 1.3;

export function newCard(today = toLocalDate()): SrsState {
  return { ease: 2.5, interval: 0, reps: 0, lapses: 0, due: today };
}

export function review(card: SrsState, grade: Grade, today = toLocalDate()): SrsState {
  const q = QUALITY[grade];
  const ease = Math.max(MIN_EASE, card.ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  if (q < 3) {
    return { ease, interval: 1, reps: 0, lapses: card.lapses + 1, due: addDays(today, 1) };
  }

  const reps = card.reps + 1;
  let interval: number;
  if (reps === 1) interval = 1;
  else if (reps === 2) interval = grade === 'easy' ? 4 : 3;
  else interval = Math.round(card.interval * ease);
  if (grade === 'hard') interval = Math.max(1, Math.round(interval * 0.8));
  if (grade === 'easy') interval = Math.round(interval * 1.3);

  return { ease, interval, reps, lapses: card.lapses, due: addDays(today, interval) };
}

export function isDue(card: SrsState, today = toLocalDate()): boolean {
  return card.due <= today;
}

/** Preview of the next interval for each button, shown on the review screen. */
export function previewIntervals(card: SrsState, today = toLocalDate()): Record<Grade, number> {
  const grades: Grade[] = ['again', 'hard', 'good', 'easy'];
  return Object.fromEntries(grades.map((g) => [g, review(card, g, today).interval])) as Record<Grade, number>;
}
