// Short starting diagnostic: 6 multiple-choice tasks in 7 minutes, one point each.
// Blocks: algebra (2), probability (1), progression (1), geometry (2). The result is
// shown on the 19-point scale of part 1 (ceil(correct · 19 / 6)). Can be retaken;
// it seeds block mastery for the plan until the full diagnostic has been taken.
import type { Task } from '../../content/types.ts';
import { toLocalDate } from '@/lib/dates.ts';
import { masteryFromDiagnostic } from '@/lib/predict.ts';
import { createRng, shuffle } from '@/lib/rng.ts';
import { db, type QuickDiagnosticResult } from './db.ts';
import { addXpAndActivity, getProfile, updateProfile } from './profile.ts';
import { getTopicState } from './progress.ts';
import { sync } from './sync.ts';
import { MAX_SCORE, topics } from './topics.ts';

export const QUICK_MINUTES = 7;
export const QUICK_SCORED = 6;
export const QUICK_MAX = MAX_SCORE; // 19
export const QUICK_XP = 20;

export type Block = 'algebra' | 'probability' | 'progression' | 'geometry';
export const BLOCKS: Block[] = ['algebra', 'probability', 'progression', 'geometry'];
export const BLOCK_LABEL: Record<Block, string> = {
  algebra: 'Алгебра',
  probability: 'Теория вероятностей',
  progression: 'Прогрессии',
  geometry: 'Геометрия',
};

/** Order of the screens. */
const ORDER: { templateId: string; block: Block }[] = [
  { templateId: 'quick-alg-fraction', block: 'algebra' },
  { templateId: 'quick-alg-equation', block: 'algebra' },
  { templateId: 'quick-probability', block: 'probability' },
  { templateId: 'quick-progression', block: 'progression' },
  { templateId: 'quick-geo-angle', block: 'geometry' },
  { templateId: 'quick-geo-grid', block: 'geometry' },
];

const number = (id: string) => topics.find((t) => t.id === id)?.number ?? 0;
/** Which block a task number belongs to when seeding starting mastery. */
export function blockOf(topicId: string): Block {
  const n = number(topicId);
  if (n >= 15) return 'geometry';
  if (n === 10) return 'probability';
  if (n === 14) return 'progression';
  return 'algebra';
}

export function blockOfTask(task: Task): Block {
  return ORDER.find((o) => o.templateId === task.templateId)?.block ?? blockOf(task.topicId);
}

/** Six screens, one random variant per template. */
export function buildQuickDiagnostic(quickTasks: Task[], seed: string): Task[] {
  const rng = createRng(`quick:${seed}`);
  return ORDER.map((o) => shuffle(rng, quickTasks.filter((t) => t.templateId === o.templateId))[0]).filter((t): t is Task => Boolean(t));
}

/** Correct answers → the 19-point scale, rounded up (6 does not divide 19). */
export const toScale = (correct: number) => Math.min(QUICK_MAX, Math.ceil((correct * QUICK_MAX) / QUICK_SCORED));

export interface QuickAnswer {
  task: Task;
  correct: boolean;
}

export function scoreQuick(answers: QuickAnswer[]): { correct: number; blocks: Record<Block, { correct: number; total: number }> } {
  const blocks: Record<Block, { correct: number; total: number }> = { algebra: { correct: 0, total: 0 }, probability: { correct: 0, total: 0 }, progression: { correct: 0, total: 0 }, geometry: { correct: 0, total: 0 } };
  for (const a of answers) {
    const b = blocks[blockOfTask(a.task)];
    b.total += 1;
    if (a.correct) b.correct += 1;
  }
  return { correct: BLOCKS.reduce((s, b) => s + blocks[b].correct, 0), blocks };
}

export async function finishQuickDiagnostic(answers: QuickAnswer[]): Promise<QuickDiagnosticResult> {
  const { correct, blocks } = scoreQuick(answers);
  const profile = await getProfile();
  const result: QuickDiagnosticResult = {
    date: toLocalDate(),
    takenAt: Date.now(),
    correct,
    total: QUICK_SCORED,
    score: toScale(correct),
    blocks,
    runs: (profile.quickDiagnostic?.runs ?? 0) + 1,
  };
  // The plan follows the start test only until the full diagnostic has been taken.
  if (profile.diagnostic === null) {
    await db.transaction('rw', db.topics, async () => {
      for (const topic of topics) {
        const state = await getTopicState(topic.id);
        const b = blocks[blockOf(topic.id)];
        const fresh = masteryFromDiagnostic(b.correct, b.total);
        // Topics already practised keep half of their own evidence.
        const mastery = state.attempts > 0 && state.mastery > 0 ? (state.mastery + fresh) / 2 : fresh;
        await db.topics.put({ ...state, mastery, updatedAt: Date.now() });
      }
    });
  }
  await updateProfile({ quickDiagnostic: result });
  if (result.runs === 1) await addXpAndActivity(QUICK_XP);
  void sync();
  return result;
}
