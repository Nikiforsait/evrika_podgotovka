// Formula cards scheduled with SM-2.
import { toLocalDate } from '@/lib/dates.ts';
import { newCard, review, type Grade } from '@/lib/srs.ts';
import { db, type CardState } from './db.ts';
import { addXpAndActivity } from './profile.ts';
import { allFormulaCards, topicById } from './topics.ts';

export const CARD_XP = 2;

export async function cardState(id: string, topicId: string): Promise<CardState> {
  return (await db.cards.get(id)) ?? { ...newCard(), id, topicId, updatedAt: 0 };
}

/** Cards due today for a topic (or all topics), including never-seen cards. */
export async function dueCards(topicId?: string, today = toLocalDate()) {
  const defs = topicId ? allFormulaCards.filter((c) => c.topicId === topicId) : allFormulaCards;
  const states = await db.cards.bulkGet(defs.map((d) => d.id));
  return defs
    .map((def, i) => ({ def, state: states[i] ?? { ...newCard(today), id: def.id, topicId: def.topicId, updatedAt: 0 } }))
    .filter(({ state }) => state.due <= today);
}

export async function gradeCard(id: string, topicId: string, grade: Grade): Promise<CardState> {
  const current = await cardState(id, topicId);
  const next: CardState = { ...current, ...review(current, grade), updatedAt: Date.now() };
  await db.cards.put(next);
  await addXpAndActivity(CARD_XP);
  return next;
}

/** Share of a topic's formula cards that have been reviewed successfully at least once. */
export async function formulaProgress(topicId: string): Promise<{ learned: number; total: number }> {
  const defs = topicById(topicId)?.formulas ?? [];
  const states = await db.cards.bulkGet(defs.map((d) => d.id));
  return { learned: states.filter((s) => s && s.reps > 0).length, total: defs.length };
}
