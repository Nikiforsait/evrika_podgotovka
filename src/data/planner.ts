// Chooses what to practise next: the topic with the most points to gain,
// then the task whose success chance is closest to 70%.
import type { Task } from '../../content/types.ts';
import { selectNext } from '@/lib/elo.ts';
import { topicPriority } from '@/lib/predict.ts';
import { db, type TopicState } from './db.ts';
import { recentTaskIds } from './progress.ts';
import { topics, type Topic } from './topics.ts';
import { START_RATING } from '@/lib/elo.ts';

export async function topicStates(): Promise<Record<string, TopicState | undefined>> {
  const rows = await db.topics.toArray();
  return Object.fromEntries(rows.map((r) => [r.topicId, r]));
}

export async function suggestTopic(): Promise<Topic> {
  const states = await topicStates();
  const ranked = [...topics].sort(
    (a, b) => topicPriority(b, states[b.id]?.mastery ?? 0) - topicPriority(a, states[a.id]?.mastery ?? 0),
  );
  return ranked[0] ?? (topics[0] as Topic);
}

/** Next adaptive task in a topic (or the suggested topic when none is given). */
export async function nextTask(tasks: Task[], topicId?: string, exclude: string[] = []): Promise<Task | undefined> {
  const topic = topicId ?? (await suggestTopic()).id;
  const state = await db.topics.get(topic);
  const recent = await recentTaskIds();
  exclude.forEach((id) => recent.add(id));
  const pool = tasks.filter((t) => t.topicId === topic && !exclude.includes(t.id));
  return selectNext(pool, state?.rating ?? START_RATING, recent);
}

export const SESSION_LENGTH = 8;
