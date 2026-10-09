// Individual learning plan: a pure function of the learner's history.
// For each task number it picks the working level (0 foundation … 3 full),
// a status, and a priority; then it lays out today's blocks and a week map.
import { daysBetween } from './dates.ts';

export type PlanLevel = 0 | 1 | 2 | 3;
export type TopicStatus = 'notStarted' | 'foundation' | 'learning' | 'practicing' | 'mastered';

export interface TopicHistory {
  id: string;
  number: number;
  title: string;
  short: string;
  weight: number;
  mastery: number; // 0..1
  attempts: number; // scored attempts (non-diagnostic)
  /** Diagnostic result for this task number: true/false, or null if not taken. */
  diagnosticCorrect: boolean | null;
  /** Recent results per level, oldest → newest, 1 = correct, 0 = wrong. */
  byLevel: Record<PlanLevel, number[]>;
  lastPracticed: string | null; // local date
  /** Attempts made today per level. */
  doneToday: Record<PlanLevel, number>;
}

export interface TopicPlan {
  id: string;
  number: number;
  title: string;
  short: string;
  level: PlanLevel;
  status: TopicStatus;
  priority: number;
  mastery: number;
  /** Share of the level ladder completed (0..1), for progress bars. */
  ladder: number;
  nextStep: string;
}

export interface PlanBlock {
  kind: 'practice' | 'cards';
  topicId: string;
  number: number;
  title: string;
  level: PlanLevel;
  count: number;
  done: number;
}

export interface DayPlan {
  date: string;
  topicIds: string[];
}

export interface LearningPlan {
  topics: TopicPlan[];
  today: PlanBlock[];
  week: DayPlan[];
  mastered: number;
  total: number;
}

export const RECENT = 5; // attempts considered per level
export const ADVANCE_AT = 0.8; // ≥ 4 of 5 correct → next level
export const DROP_AT = 0.4; // ≤ 2 of 5 correct → previous level
const MIN_EVIDENCE = 3;

const accuracy = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Working level for a task number, walking up or down from the diagnostic start. */
export function currentLevel(h: TopicHistory): { level: PlanLevel; mastered: boolean } {
  let level: PlanLevel = h.diagnosticCorrect === true ? 3 : 1;
  for (let guard = 0; guard < 6; guard++) {
    const recent = h.byLevel[level].slice(-RECENT);
    if (recent.length < MIN_EVIDENCE) break;
    const acc = accuracy(recent);
    if (acc >= ADVANCE_AT) {
      if (level === 3) return { level, mastered: recent.length >= 4 && h.mastery >= 0.6 };
      level = (level + 1) as PlanLevel;
      continue;
    }
    if (acc <= DROP_AT && level > 0) {
      level = (level - 1) as PlanLevel;
      // One step down at most; the learner needs fresh evidence there.
      break;
    }
    break;
  }
  return { level, mastered: false };
}

const LEVEL_WORD: Record<PlanLevel, string> = { 0: 'основу', 1: 'базовые задания', 2: 'задания среднего уровня', 3: 'сложные задания' };

function describe(status: TopicStatus, level: PlanLevel, recentAtLevel: number): string {
  if (status === 'mastered') return 'Освоено. Иногда повторяй, чтобы не забыть.';
  if (status === 'notStarted') return 'Пройди диагностику или начни с базовых заданий.';
  const left = Math.max(0, 4 - recentAtLevel);
  const tail = left > 0 ? ` Ещё ${left} верн${left === 1 ? 'ое' : 'ых'} — и уровень выше.` : ' Почти готово к следующему уровню.';
  return `Реши ${LEVEL_WORD[level]}.${level < 3 ? tail : ''}`;
}

export function planTopic(h: TopicHistory, today: string): TopicPlan {
  const { level, mastered } = currentLevel(h);
  const status: TopicStatus = mastered
    ? 'mastered'
    : h.attempts === 0 && h.diagnosticCorrect === null
      ? 'notStarted'
      : level === 0
        ? 'foundation'
        : level === 1
          ? 'learning'
          : 'practicing';
  const stale = h.lastPracticed ? Math.min(7, daysBetween(h.lastPracticed, today)) / 7 : 1;
  const priority = mastered ? 0.1 * h.weight : h.weight * (1 - h.mastery) * (1 + 0.5 * stale);
  const recentAtLevel = h.byLevel[level].slice(-RECENT).reduce((a, b) => a + b, 0);
  const ladder = mastered ? 1 : (level + Math.min(1, accuracy(h.byLevel[level].slice(-RECENT)))) / 4;
  return { id: h.id, number: h.number, title: h.title, short: h.short, level, status, priority, mastery: h.mastery, ladder, nextStep: describe(status, level, recentAtLevel) };
}

export interface PlanOptions {
  blocksPerDay?: number;
  tasksPerBlock?: number;
  dueCards?: { topicId: string; count: number } | null;
  days?: number;
}

/** Build the full plan: per-topic state, today's blocks and a week map. */
export function buildPlan(history: TopicHistory[], today: string, opts: PlanOptions = {}): LearningPlan {
  const blocksPerDay = opts.blocksPerDay ?? 3;
  const tasksPerBlock = opts.tasksPerBlock ?? 5;
  const days = opts.days ?? 7;
  const byId = new Map(history.map((h) => [h.id, h]));
  const topics = history.map((h) => planTopic(h, today)).sort((a, b) => a.number - b.number);
  // Stable priority order: higher priority first, ties by task number.
  const ranked = [...topics].sort((a, b) => b.priority - a.priority || a.number - b.number);
  const active = ranked.filter((t) => t.status !== 'mastered');
  const queue = active.length ? active : ranked;
  // Topics already practised today stay in today's list, so a started block can be finished.
  const practisedToday = (id: string) => Object.values(byId.get(id)!.doneToday).some((n) => n > 0);
  const pinned = ranked.filter((t) => practisedToday(t.id)).slice(0, blocksPerDay).map((t) => t.id);
  const rest = queue.filter((t) => !pinned.includes(t.id));

  const week: DayPlan[] = [];
  let cursor = 0;
  for (let d = 0; d < days; d++) {
    const ids = d === 0 ? [...pinned] : [];
    while (ids.length < blocksPerDay && rest.length) {
      const t = rest[cursor % rest.length]!;
      cursor++;
      if (!ids.includes(t.id)) ids.push(t.id);
      if (cursor > rest.length * 2) break;
    }
    week.push({ date: addDays(today, d), topicIds: ids });
  }

  const todayBlocks: PlanBlock[] = (week[0]?.topicIds ?? []).map((id) => {
    const t = topics.find((x) => x.id === id)!;
    const h = byId.get(id)!;
    // Progress counts every task solved today for this topic, even if the level has since changed.
    const doneToday = Object.values(h.doneToday).reduce((a, b) => a + b, 0);
    return { kind: 'practice', topicId: id, number: t.number, title: t.title, level: t.level, count: tasksPerBlock, done: Math.min(tasksPerBlock, doneToday) };
  });
  if (opts.dueCards && opts.dueCards.count > 0) {
    const t = topics.find((x) => x.id === opts.dueCards!.topicId);
    if (t) todayBlocks.unshift({ kind: 'cards', topicId: t.id, number: t.number, title: t.title, level: t.level, count: opts.dueCards.count, done: 0 });
  }

  return { topics, today: todayBlocks, week, mastered: topics.filter((t) => t.status === 'mastered').length, total: topics.length };
}

function addDays(date: string, n: number): string {
  const [y = 1970, m = 1, d = 1] = date.split('-').map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
}
