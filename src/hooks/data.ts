// React hooks over the local database. useLiveQuery re-renders on any change.
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useState } from 'react';
import type { Task } from '../../content/types.ts';
import { loadTasks } from '@/data/content.ts';
import { db, type TopicState } from '@/data/db.ts';
import { DEFAULT_PROFILE } from '@/data/profile.ts';
import { topics } from '@/data/topics.ts';
import { predictScore, type Prediction } from '@/lib/predict.ts';

export function useProfile() {
  return useLiveQuery(() => db.profile.get('me'), [], undefined) ?? DEFAULT_PROFILE;
}

export function useTopicStates(): Record<string, TopicState | undefined> {
  const rows = useLiveQuery(() => db.topics.toArray(), [], []);
  return Object.fromEntries(rows.map((r) => [r.topicId, r]));
}

export function usePrediction(): Prediction {
  const states = useTopicStates();
  return predictScore(topics, states);
}

export function useTasks(): { tasks: Task[] | null; error: string | null } {
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    loadTasks()
      .then((t) => alive && setTasks(t))
      .catch(() => alive && setError('Не удалось загрузить задания. Проверьте соединение и обновите страницу.'));
    return () => {
      alive = false;
    };
  }, []);
  return { tasks, error };
}
