import { describe, expect, it } from 'vitest';
import { compareDiagnostics } from './diagnosticCompare.ts';
import { expectedScore, selectNext, updateRating } from './elo.ts';
import { analyzeError, buildOptions } from './errors.ts';
import { currentStreak, levelFromXp, registerActivity } from './gamification.ts';
import { buildPlan, currentLevel, type TopicHistory } from './plan.ts';
import { predictScore, updateMastery } from './predict.ts';
import { formatRational, parseRational, sameValue } from './rational.ts';
import { createRng } from './rng.ts';
import { newCard, review } from './srs.ts';

describe('rational', () => {
  it('parses user input in Russian formats', () => {
    expect(sameValue('4 000', '4000')).toBe(true);
    expect(sameValue('2,5', '5/2')).toBe(true);
    expect(sameValue('−3/4', '-3/4')).toBe(true);
    expect(parseRational('abc')).toBeNull();
  });
  it('formats numbers for display', () => {
    expect(formatRational({ n: 5000, d: 1 })).toBe('5 000');
    expect(formatRational({ n: 1, d: 4 })).toBe('0,25');
    expect(formatRational({ n: 1, d: 3 })).toBe('1/3');
  });
});

describe('srs (SM-2)', () => {
  it('grows intervals on success and resets on failure', () => {
    let c = newCard('2026-01-01');
    c = review(c, 'good', '2026-01-01');
    expect(c.interval).toBe(1);
    c = review(c, 'good', '2026-01-02');
    expect(c.interval).toBe(3);
    c = review(c, 'good', '2026-01-05');
    expect(c.interval).toBeGreaterThan(3);
    const failed = review(c, 'again', '2026-01-10');
    expect(failed).toMatchObject({ interval: 1, reps: 0, lapses: 1, due: '2026-01-11' });
    expect(failed.ease).toBeGreaterThanOrEqual(1.3);
  });
});

describe('elo', () => {
  it('raises rating after a correct answer and lowers it after a wrong one', () => {
    expect(updateRating(1000, 1000, 1, 0)).toBeGreaterThan(1000);
    expect(updateRating(1000, 1000, 0, 0)).toBeLessThan(1000);
  });
  it('picks the task closest to P = 0.7', () => {
    const pool = [800, 850, 1000, 1150, 1300].map((rating, i) => ({ id: `t${i}`, rating }));
    const next = selectNext(pool, 1000);
    expect(next).toBeDefined();
    expect(Math.abs(expectedScore(1000, next!.rating) - 0.7)).toBeLessThan(0.1);
  });
  it('skips recently seen tasks', () => {
    const pool = [{ id: 'a', rating: 850 }, { id: 'b', rating: 860 }];
    expect(selectNext(pool, 1000, new Set(['a']))?.id).toBe('b');
  });
});

describe('predict', () => {
  it('applies mastery += 0.1 · (result − mastery)', () => {
    expect(updateMastery(0.5, 1)).toBeCloseTo(0.55);
    expect(updateMastery(0.5, 0)).toBeCloseTo(0.45);
  });
  it('sums maxScore × mastery', () => {
    const topics = [{ id: 'a', weight: 1, maxScore: 3 }, { id: 'b', weight: 1, maxScore: 2 }];
    const p = predictScore(topics, { a: { mastery: 1, attempts: 50 }, b: { mastery: 0.5, attempts: 50 } });
    expect(p.score).toBe(4);
    expect(p.max).toBe(5);
    expect(p.low).toBeLessThanOrEqual(p.score);
  });
});

describe('errors', () => {
  const task = { answer: '4000', wrong: [{ value: '1000', error: 'wrongFormula' as const, note: 'скидка' }] };
  it('classifies typical mistakes', () => {
    expect(analyzeError('1000', task)?.kind).toBe('wrongFormula');
    expect(analyzeError('-4000', task)?.kind).toBe('sign');
    expect(analyzeError('400', task)?.kind).toBe('decimal');
    expect(analyzeError('4001', task)?.kind).toBe('rounding');
    expect(analyzeError('4000', task)).toBeNull();
    expect(analyzeError('73', { answer: '37', wrong: [] })?.kind).toBe('digitSwap');
  });
  it('builds four unique options including the answer', () => {
    const opts = buildOptions('0', [], createRng(1));
    expect(opts).toHaveLength(4);
    expect(new Set(opts.map((o) => o.value)).size).toBe(4);
    expect(opts.some((o) => o.value === '0')).toBe(true);
  });
});

describe('gamification', () => {
  it('computes levels from XP', () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(100).level).toBe(2);
    expect(levelFromXp(299).level).toBe(2);
    expect(levelFromXp(300).level).toBe(3);
  });
  it('keeps a streak with a freeze token and resets without one', () => {
    const base = { streak: 5, best: 5, freezes: 1, lastActive: '2026-01-10' };
    expect(registerActivity(base, '2026-01-11').streak).toBe(6);
    const frozen = registerActivity(base, '2026-01-12');
    expect(frozen).toMatchObject({ streak: 6, freezes: 0, usedFreezes: 1 });
    expect(registerActivity({ ...base, freezes: 0 }, '2026-01-12').streak).toBe(1);
    expect(currentStreak({ ...base, freezes: 0 }, '2026-01-13')).toBe(0);
  });
  it('earns a freeze every 7 days', () => {
    const s = registerActivity({ streak: 6, best: 6, freezes: 0, lastActive: '2026-01-06' }, '2026-01-07');
    expect(s).toMatchObject({ streak: 7, freezes: 1 });
  });
});


describe('diagnostic comparison', () => {
  const run = (predicted: number, byTopic: Record<string, [number, number]>) => ({
    date: '2026-10-01',
    correct: Object.values(byTopic).reduce((s, [c]) => s + c, 0),
    total: Object.values(byTopic).reduce((s, [, t]) => s + t, 0),
    predicted,
    max: 19,
    byTopic: Object.fromEntries(Object.entries(byTopic).map(([k, [correct, total]]) => [k, { correct, total }])),
  });
  it('splits topics into improved, worsened and unchanged', () => {
    const prev = run(5, { percent: [1, 3], fractions: [3, 3], areas: [1, 2], powers: [1, 2] });
    const curr = run(8, { percent: [3, 3], fractions: [1, 3], areas: [1, 2], powers: [1, 2] });
    const cmp = compareDiagnostics(prev, curr);
    expect(cmp.scoreDelta).toBe(3);
    expect(cmp.improved.map((c) => c.topicId)).toEqual(['percent']);
    expect(cmp.worsened.map((c) => c.topicId)).toEqual(['fractions']);
    expect(cmp.unchanged.map((c) => c.topicId).sort()).toEqual(['areas', 'powers']);
    expect(cmp.accuracyDelta).toBe(0);
  });
  it('ignores topics that were not tested both times', () => {
    const cmp = compareDiagnostics(run(5, { percent: [1, 3] }), run(6, { percent: [1, 3], areas: [2, 2] }));
    expect([...cmp.improved, ...cmp.worsened, ...cmp.unchanged].map((c) => c.topicId)).toEqual(['percent']);
  });
});

describe('learning plan', () => {
  const hist = (over: Partial<TopicHistory>): TopicHistory => ({
    id: 't1', number: 1, title: 'T', short: 'T', weight: 1, mastery: 0.3, attempts: 0, diagnosticCorrect: null,
    byLevel: { 0: [], 1: [], 2: [], 3: [] }, lastPracticed: null, doneToday: { 0: 0, 1: 0, 2: 0, 3: 0 }, ...over,
  });
  it('starts at level 1, or 3 after a correct diagnostic answer', () => {
    expect(currentLevel(hist({})).level).toBe(1);
    expect(currentLevel(hist({ diagnosticCorrect: true })).level).toBe(3);
  });
  it('advances after 4 of 5 correct and drops after 2 of 5', () => {
    expect(currentLevel(hist({ byLevel: { 0: [], 1: [1, 1, 0, 1, 1], 2: [], 3: [] } })).level).toBe(2);
    expect(currentLevel(hist({ byLevel: { 0: [], 1: [1, 1, 1, 1], 2: [1, 1, 1, 1], 3: [] } })).level).toBe(3);
    expect(currentLevel(hist({ byLevel: { 0: [], 1: [0, 0, 1, 0, 0], 2: [], 3: [] } })).level).toBe(0);
  });
  it('marks a topic mastered only with strong results at level 3', () => {
    expect(currentLevel(hist({ diagnosticCorrect: true, mastery: 0.7, byLevel: { 0: [], 1: [], 2: [], 3: [1, 1, 1, 1, 0] } })).mastered).toBe(true);
    expect(currentLevel(hist({ diagnosticCorrect: true, mastery: 0.3, byLevel: { 0: [], 1: [], 2: [], 3: [1, 1, 1, 1] } })).mastered).toBe(false);
  });
  it('schedules weakest topics first and fills a week', () => {
    const topics = [1, 2, 3, 4, 5].map((n) => hist({ id: `t${n}`, number: n, mastery: n / 5, attempts: 1 }));
    const plan = buildPlan(topics, '2026-10-08', { blocksPerDay: 2, tasksPerBlock: 5 });
    expect(plan.today.map((b) => b.topicId)).toEqual(['t1', 't2']);
    expect(plan.week).toHaveLength(7);
    expect(plan.week[1]?.topicIds).toEqual(['t3', 't4']);
    expect(plan.mastered).toBe(0);
  });
});
