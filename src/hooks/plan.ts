import { useLiveQuery } from 'dexie-react-hooks';
import { learningPlan } from '@/data/plan.ts';
import type { LearningPlan } from '@/lib/plan.ts';

/** The learning plan, recomputed whenever attempts, topics, cards or the profile change. */
export function usePlan(): LearningPlan | undefined {
  return useLiveQuery(() => learningPlan(), []);
}
