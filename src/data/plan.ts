// Collects the learner's history from IndexedDB and builds the learning plan.
import { toLocalDate } from '@/lib/dates.ts';
import { buildPlan, type LearningPlan, type PlanLevel, type TopicHistory } from '@/lib/plan.ts';
import { dueCards } from './cards.ts';
import { db } from './db.ts';
import { DEFAULT_PROFILE } from './profile.ts';
import { topics } from './topics.ts';

const HISTORY_DAYS = 45;
const emptyLevels = (): Record<PlanLevel, number[]> => ({ 0: [], 1: [], 2: [], 3: [] });
const zeroLevels = (): Record<PlanLevel, number> => ({ 0: 0, 1: 0, 2: 0, 3: 0 });

export async function topicHistories(today = toLocalDate()): Promise<TopicHistory[]> {
  // Read-only: this runs inside liveQuery, where writes (like creating a default profile) are not allowed.
  const [profile, states, attempts] = await Promise.all([
    db.profile.get('me').then((p) => p ?? DEFAULT_PROFILE),
    db.topics.toArray(),
    db.attempts.where('ts').above(Date.now() - HISTORY_DAYS * 86_400_000).sortBy('ts'),
  ]);
  const stateById = new Map(states.map((s) => [s.topicId, s]));
  const diag = profile.diagnostic?.byTopic ?? {};

  return topics.map((t) => {
    const byLevel = emptyLevels();
    const doneToday = zeroLevels();
    let lastPracticed: string | null = null;
    for (const a of attempts) {
      if (a.topicId !== t.id || a.mode === 'diagnostic') continue;
      const level = (a.level ?? 2) as PlanLevel;
      byLevel[level].push(a.result >= 1 ? 1 : 0);
      if (a.date === today) doneToday[level] += 1;
      lastPracticed = a.date;
    }
    const d = diag[t.id];
    return {
      id: t.id,
      number: t.number,
      title: t.title,
      short: t.short,
      weight: t.weight,
      mastery: stateById.get(t.id)?.mastery ?? 0,
      attempts: byLevel[0].length + byLevel[1].length + byLevel[2].length + byLevel[3].length,
      diagnosticCorrect: d ? d.correct > 0 : null,
      byLevel,
      lastPracticed,
      doneToday,
    };
  });
}

export async function learningPlan(today = toLocalDate()): Promise<LearningPlan> {
  const [history, due] = await Promise.all([topicHistories(today), dueCards(undefined, today)]);
  const reviews = due.filter((c) => c.state.reps > 0 || c.state.lapses > 0);
  const counts = new Map<string, number>();
  for (const c of reviews) counts.set(c.def.topicId, (counts.get(c.def.topicId) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  return buildPlan(history, today, { dueCards: top ? { topicId: top[0], count: reviews.length } : null });
}
