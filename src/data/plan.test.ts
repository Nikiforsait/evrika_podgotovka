import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it } from 'vitest';
import { db } from './db.ts';
import { learningPlan } from './plan.ts';
import { DEFAULT_PROFILE } from './profile.ts';

const TODAY = '2026-10-08';
const NOW = new Date(2026, 9, 8, 12).getTime();

describe('learningPlan (IndexedDB)', () => {
  beforeAll(async () => {
    await db.profile.put({
      ...DEFAULT_PROFILE,
      diagnostic: { date: TODAY, correct: 1, total: 19, predicted: 4, max: 19, byTopic: { t7: { correct: 1, total: 1 }, t9: { correct: 0, total: 1 } } },
    });
    await db.topics.put({ topicId: 't9', mastery: 0.15, rating: 950, attempts: 5, conceptRead: false, updatedAt: NOW });
    for (let i = 0; i < 5; i++) {
      await db.attempts.add({ id: `a${i}`, taskId: `t9-x-${i}`, topicId: 't9', mode: 'practice', level: 1, result: i === 2 ? 1 : 0, answer: '', xp: 2, masteryAfter: 0.15, date: TODAY, ts: NOW + i });
    }
  });

  it('builds a plan from stored history and pins today’s practised topic', async () => {
    const plan = await learningPlan(TODAY);
    expect(plan.total).toBe(19);
    expect(plan.today.length).toBeGreaterThanOrEqual(3);
    const t9 = plan.topics.find((t) => t.id === 't9')!;
    expect(t9.level).toBe(0); // 1 of 5 at level 1 → drop to foundation
    expect(plan.today.some((b) => b.topicId === 't9')).toBe(true);
    const t7 = plan.topics.find((t) => t.id === 't7')!;
    expect(t7.level).toBe(3); // diagnostic answered correctly
  });
});
