// Topic completion used by the topic hub and topic list.
export const MASTERED = 0.75;

/** Concept read = 20%, formula cards learned = 30%, task mastery = 50%. */
export function completion(conceptRead: boolean, learned: number, total: number, mastery: number): number {
  const cards = total ? learned / total : 1;
  return (conceptRead ? 0.2 : 0) + cards * 0.3 + Math.min(1, mastery / MASTERED) * 0.5;
}
