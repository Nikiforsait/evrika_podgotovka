// Compares two diagnostic runs: overall score/accuracy and per-topic accuracy.

export interface DiagnosticSnapshot {
  date: string;
  correct: number;
  total: number;
  predicted: number;
  max: number;
  byTopic: Record<string, { correct: number; total: number }>;
}

export type Trend = 'up' | 'down' | 'same';

export interface TopicChange {
  topicId: string;
  before: number; // accuracy 0..1
  after: number;
  delta: number;
  trend: Trend;
}

export interface DiagnosticComparison {
  previousDate: string;
  scoreDelta: number; // predicted points
  accuracyDelta: number; // 0..1 scale
  improved: TopicChange[];
  worsened: TopicChange[];
  unchanged: TopicChange[];
}

/** Changes smaller than this (in accuracy) count as "no change". */
export const SAME_THRESHOLD = 0.05;

const accuracy = (e: { correct: number; total: number } | undefined) => (e && e.total ? e.correct / e.total : 0);

export function trendOf(delta: number, threshold = SAME_THRESHOLD): Trend {
  if (delta > threshold) return 'up';
  if (delta < -threshold) return 'down';
  return 'same';
}

/** Topic changes are compared only for topics tested in both runs. */
export function compareDiagnostics(prev: DiagnosticSnapshot, curr: DiagnosticSnapshot): DiagnosticComparison {
  const changes: TopicChange[] = Object.keys(curr.byTopic)
    .filter((id) => prev.byTopic[id])
    .map((topicId) => {
      const before = accuracy(prev.byTopic[topicId]);
      const after = accuracy(curr.byTopic[topicId]);
      const delta = after - before;
      return { topicId, before, after, delta, trend: trendOf(delta) };
    });

  return {
    previousDate: prev.date,
    scoreDelta: curr.predicted - prev.predicted,
    accuracyDelta: accuracy(curr) - accuracy(prev),
    improved: changes.filter((c) => c.trend === 'up').sort((a, b) => b.delta - a.delta),
    worsened: changes.filter((c) => c.trend === 'down').sort((a, b) => a.delta - b.delta),
    unchanged: changes.filter((c) => c.trend === 'same'),
  };
}
