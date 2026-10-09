// Recording answers: updates Elo rating, mastery, XP, streak and mistake notes.
import type { Task } from '../../content/types.ts';
import { toLocalDate } from '@/lib/dates.ts';
import { START_RATING, updateRating } from '@/lib/elo.ts';
import { analyzeError, type ErrorAnalysis } from '@/lib/errors.ts';
import { xpForAnswer } from '@/lib/gamification.ts';
import { updateMastery } from '@/lib/predict.ts';
import { sameValue } from '@/lib/rational.ts';
import { db, uid, type Mode, type TopicState } from './db.ts';
import { addXpAndActivity } from './profile.ts';

export async function getTopicState(topicId: string): Promise<TopicState> {
  return (
    (await db.topics.get(topicId)) ?? {
      topicId,
      mastery: 0,
      rating: START_RATING,
      attempts: 0,
      conceptRead: false,
      updatedAt: 0,
    }
  );
}

export interface AnswerOutcome {
  correct: boolean;
  result: number;
  xp: number;
  error: ErrorAnalysis | null;
}

const digitKey = (s: string) => s.replace(/\D/g, '').split('').sort().join('');

export function checkAnswer(task: Task, answer: string): boolean {
  if (task.answerMode === 'digitset') return digitKey(answer) === digitKey(task.answer) && digitKey(answer).length > 0;
  if (task.display === 'digits') return answer.replace(/\s/g, '') === task.answer;
  return sameValue(answer, task.answer);
}

/**
 * Persist one answer. `usedHint` halves the result (0.5) when correct.
 * Diagnostic answers update rating and attempts; mastery is set at the end.
 */
export async function recordAnswer(task: Task, answer: string, mode: Mode, usedHint = false): Promise<AnswerOutcome> {
  const correct = checkAnswer(task, answer);
  const result = correct ? (usedHint ? 0.5 : 1) : 0;
  const error = correct ? null : analyzeError(answer, task);
  const xp = mode === 'diagnostic' ? 0 : xpForAnswer(task.level, result);
  const today = toLocalDate();

  await db.transaction('rw', [db.topics, db.attempts, db.notes, db.profile], async () => {
    const state = await getTopicState(task.topicId);
    const mastery = mode === 'diagnostic' ? state.mastery : updateMastery(state.mastery, result);
    const rating = updateRating(state.rating, task.rating, result, state.attempts);
    await db.topics.put({ ...state, mastery, rating, attempts: state.attempts + 1, updatedAt: Date.now() });
    await db.attempts.add({
      id: uid(),
      taskId: task.id,
      topicId: task.topicId,
      mode,
      level: task.level,
      result,
      answer,
      errorKind: error?.kind,
      xp,
      masteryAfter: mastery,
      date: today,
      ts: Date.now(),
    });
    if (error) {
      await db.notes.add({
        id: uid(),
        topicId: task.topicId,
        kind: error.kind,
        text: error.note,
        taskText: task.text.replace(/\[\[|\]\]/g, ''),
        createdAt: Date.now(),
      });
    }
    if (mode !== 'diagnostic') await addXpAndActivity(xp, today);
  });

  return { correct, result, xp, error };
}

export async function markConceptRead(topicId: string): Promise<void> {
  const state = await getTopicState(topicId);
  if (state.conceptRead) return;
  await db.topics.put({ ...state, conceptRead: true, updatedAt: Date.now() });
  await addXpAndActivity(3);
}

/** Task ids answered in the last `days` days, to avoid repeats. */
export async function recentTaskIds(days = 7): Promise<Set<string>> {
  const since = Date.now() - days * 86_400_000;
  const rows = await db.attempts.where('ts').above(since).toArray();
  return new Set(rows.map((r) => r.taskId));
}
