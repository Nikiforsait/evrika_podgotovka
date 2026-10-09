// Score prediction from per-topic mastery.
// Mastery update follows the product rule: mastery += 0.1 · (result − mastery),
// an exponentially weighted average of recent results (0, 0.5 or 1).

export const MASTERY_RATE = 0.1;

export interface TopicWeight {
  id: string;
  weight: number;
  maxScore: number;
}

export interface TopicMastery {
  mastery: number; // 0..1
  attempts: number;
}

export function updateMastery(mastery: number, result: number, rate = MASTERY_RATE): number {
  const next = mastery + rate * (result - mastery);
  return Math.min(1, Math.max(0, next));
}

/**
 * Starting mastery after the diagnostic. With one question per task number the
 * evidence is thin, so the scale is compressed: wrong → 0.2, right → 0.7.
 */
export function masteryFromDiagnostic(correct: number, total: number): number {
  return total > 0 ? 0.2 + 0.5 * (correct / total) : 0;
}

export type MasteryLevel = 'low' | 'medium' | 'high';

export function masteryLevel(mastery: number): MasteryLevel {
  if (mastery >= 0.75) return 'high';
  if (mastery >= 0.4) return 'medium';
  return 'low';
}

export interface Prediction {
  score: number; // expected points, rounded
  max: number;
  low: number; // ~80% band
  high: number;
  byTopic: Record<string, number>;
}

/** Expected score = Σ maxScore_t · mastery_t, with an uncertainty band. */
export function predictScore(
  topics: readonly TopicWeight[],
  state: Readonly<Record<string, TopicMastery | undefined>>,
): Prediction {
  let expected = 0;
  let variance = 0;
  let max = 0;
  const byTopic: Record<string, number> = {};
  for (const t of topics) {
    const s = state[t.id];
    const m = s?.mastery ?? 0;
    const n = s?.attempts ?? 0;
    expected += t.maxScore * m;
    // Fewer attempts → wider band.
    variance += (t.maxScore ** 2 * Math.max(m * (1 - m), 0.05)) / (n + 1);
    max += t.maxScore;
    byTopic[t.id] = t.maxScore * m;
  }
  const band = 1.28 * Math.sqrt(variance);
  const clamp = (v: number) => Math.min(max, Math.max(0, Math.round(v)));
  return { score: clamp(expected), max, low: clamp(expected - band), high: clamp(expected + band), byTopic };
}

/** Training priority: points still available, scaled by topic weight. */
export function topicPriority(t: TopicWeight, mastery: number): number {
  return t.weight * t.maxScore * (1 - mastery);
}
