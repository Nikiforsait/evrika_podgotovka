// Diagnostic: one fixed-size test across all topics that sets starting mastery.
import type { Task } from '../../content/types.ts';
import { toLocalDate } from '@/lib/dates.ts';
import { masteryFromDiagnostic, predictScore } from '@/lib/predict.ts';
import { createRng, shuffle } from '@/lib/rng.ts';
import { db, type DiagnosticResult, type Profile } from './db.ts';
import { getProfile, addXpAndActivity, updateProfile } from './profile.ts';
import { getTopicState } from './progress.ts';
import { DIAGNOSTIC_LEVEL, topics } from './topics.ts';

export const DIAGNOSTIC_XP = 50;
const MAX_HISTORY = 12;

/**
 * One question per task number at the intermediate level (fallback: any level).
 * Tasks 1–5 come from a single practical scenario (one story, one table, one figure),
 * exactly like a real part-1 test.
 */
export function buildDiagnostic(tasks: Task[], seed = toLocalDate()): Task[] {
  const rng = createRng(`diagnostic:${seed}`);
  const scenarioPool = tasks.filter((t) => t.scenarioKey && t.level === DIAGNOSTIC_LEVEL);
  const scenarioKey = shuffle(rng, [...new Set(scenarioPool.map((t) => t.scenarioKey!))])[0] ?? null;
  const out: Task[] = [];
  for (const topic of topics) {
    const linked = scenarioKey ? scenarioPool.find((t) => t.scenarioKey === scenarioKey && t.topicId === topic.id) : undefined;
    if (linked) {
      out.push(linked);
      continue;
    }
    const pool = tasks.filter((t) => t.topicId === topic.id);
    const preferred = shuffle(rng, pool.filter((t) => t.level === DIAGNOSTIC_LEVEL));
    const task = preferred[0] ?? shuffle(rng, pool)[0];
    if (task) out.push(task);
  }
  return out;
}

export interface DiagnosticAnswer {
  taskId: string;
  topicId: string;
  correct: boolean;
}

/** Store the result and set each topic's starting mastery from its accuracy. */
export async function finishDiagnostic(answers: DiagnosticAnswer[]): Promise<DiagnosticResult> {
  const byTopic: DiagnosticResult['byTopic'] = {};
  for (const a of answers) {
    const entry = (byTopic[a.topicId] ??= { correct: 0, total: 0 });
    entry.total += 1;
    if (a.correct) entry.correct += 1;
  }

  const masteryState: Record<string, { mastery: number; attempts: number }> = {};
  await db.transaction('rw', db.topics, async () => {
    for (const topic of topics) {
      const entry = byTopic[topic.id];
      const state = await getTopicState(topic.id);
      const mastery = entry ? masteryFromDiagnostic(entry.correct, entry.total) : state.mastery;
      masteryState[topic.id] = { mastery, attempts: state.attempts };
      await db.topics.put({ ...state, mastery, updatedAt: Date.now() });
    }
  });

  const prediction = predictScore(topics, masteryState);
  const result: DiagnosticResult = {
    date: toLocalDate(),
    takenAt: Date.now(),
    correct: answers.filter((a) => a.correct).length,
    total: answers.length,
    predicted: prediction.score,
    max: prediction.max,
    byTopic,
  };
  const profile = await getProfile();
  await updateProfile({ diagnostic: result, diagnosticHistory: [...diagnosticHistory(profile), result].slice(-MAX_HISTORY) });
  await addXpAndActivity(DIAGNOSTIC_XP);
  return result;
}

/** Diagnostic runs oldest → newest; falls back to the single stored result for older data. */
export function diagnosticHistory(p: Profile): DiagnosticResult[] {
  if (p.diagnosticHistory?.length) return p.diagnosticHistory;
  return p.diagnostic ? [p.diagnostic] : [];
}

/** The run before the latest one, if the diagnostic has been taken at least twice. */
export function previousDiagnostic(p: Profile): DiagnosticResult | null {
  const history = diagnosticHistory(p);
  return history.length >= 2 ? (history[history.length - 2] ?? null) : null;
}

export async function hasDiagnostic(): Promise<boolean> {
  return (await getProfile()).diagnostic !== null;
}
