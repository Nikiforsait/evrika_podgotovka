// Shared content types used by the build pipeline and the app.

/** 0 = foundation drill (prerequisite skill), 1 = basic, 2 = intermediate, 3 = full difficulty. */
export type Level = 0 | 1 | 2 | 3;
export type AnswerFormat = 'choice' | 'input';
export type ErrorKind = 'sign' | 'decimal' | 'rounding' | 'digitSwap' | 'wrongFormula';

/** A wrong answer that comes from a known misconception. */
export interface WrongPath {
  value: string; // canonical rational
  error: ErrorKind;
  note: string; // short explanation shown in personal notes
}

export interface ChoiceOption {
  /** Canonical rational; for labelled options this is the option index "1".."4". */
  value: string;
  /** Display text when the option is not a plain number (an interval, "да"/"нет", a pair). */
  label?: string;
  error?: ErrorKind;
}

export interface TaskTable {
  head: string[];
  rows: string[][];
}

/** What a template produces for one set of parameters. */
export interface TaskDraft {
  /** Problem text. Numbers to highlight are wrapped in [[...]]. */
  text: string;
  question: string;
  /** Canonical answer: integer or reduced fraction "n/d". */
  answer: string;
  /** SymPy-parsable expression that must evaluate to `answer`. */
  expr: string;
  unit?: string;
  /** 'fraction': show n/d instead of a decimal. 'digits': the answer is a digit sequence (no grouping). */
  display?: 'fraction' | 'digits';
  /** 'digitset': the answer is a set of digits, any order is accepted (e.g. "13" == "31"). */
  answerMode?: 'digitset';
  /** Pre-built options (labelled or 2-way). When absent, distractors are generated from `wrong`. */
  options?: ChoiceOption[];
  /** Optional SVG figure (markup string) shown above the statement. Rendered as an <img>, never injected. */
  figure?: string;
  /** Accessible description of the figure. */
  figureAlt?: string;
  /** Optional data table shown between the figure and the statement. */
  table?: TaskTable;
  hint: string;
  steps: string[];
  wrong: WrongPath[];
}

/** 'quick': belongs to the short starting diagnostic, never used in training. */
export type TaskTag = 'quick';

export interface TaskTemplate {
  id: string;
  topicId: string;
  level: Level;
  format: AnswerFormat;
  tag?: TaskTag;
  generate: (rng: () => number) => TaskDraft;
}

/** One task of a practical scenario (tasks 1–5 share a story, a table and a figure). */
export interface ScenarioPart {
  topicId: string;
  format: AnswerFormat;
  draft: TaskDraft;
}

/** A scenario produces five linked tasks (t1…t5) from one set of parameters. */
export interface ScenarioTemplate {
  id: string;
  tag?: TaskTag;
  /** Levels to build (default 1, 2 and 3). */
  levels?: (1 | 2 | 3)[];
  generate: (rng: () => number, level: 1 | 2 | 3) => ScenarioPart[];
}

/** A generated, validated task as stored in the content pack. */
export interface Task extends Omit<TaskDraft, 'wrong'> {
  id: string;
  templateId: string;
  topicId: string;
  level: Level;
  format: AnswerFormat;
  /** Elo difficulty rating (≈ 700 foundation … 1300 hard). */
  rating: number;
  wrong: WrongPath[];
  /** Tasks 1–5 built from one scenario instance share this key (one story per test). */
  scenarioKey?: string;
  tag?: TaskTag;
}

export interface ContentPack {
  version: string;
  builtAt: string;
  tasks: Task[];
}
