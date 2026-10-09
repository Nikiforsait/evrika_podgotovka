import raw from './topics.json';

export interface FormulaCard {
  id: string;
  front: string;
  back: string;
}

export interface TopicLinks {
  prerequisites: string[];
  related: string[];
  specialCaseOf: string[];
}

/** One task number (1–19) of the trainer. */
export interface Topic {
  id: string;
  number: number;
  title: string;
  short: string;
  icon: string;
  weight: number;
  maxScore: number;
  guided?: boolean;
  concept: string;
  formulas: FormulaCard[];
  links: TopicLinks;
}

export const topics: Topic[] = (raw.topics as Topic[]).slice().sort((a, b) => a.number - b.number);

export const topicById = (id: string | undefined): Topic | undefined => topics.find((t) => t.id === id);

export const allFormulaCards = topics.flatMap((t) => t.formulas.map((f) => ({ ...f, topicId: t.id })));

export const MAX_SCORE = topics.reduce((sum, t) => sum + t.maxScore, 0);
/** The diagnostic asks one question per task number. */
export const DIAGNOSTIC_LENGTH = topics.length;
/** Difficulty used for diagnostic questions (0–3). */
export const DIAGNOSTIC_LEVEL = 2;
