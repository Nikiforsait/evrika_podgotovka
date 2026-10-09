import type { PlanLevel, TopicStatus } from '@/lib/plan.ts';

export const LEVEL_NAMES: Record<PlanLevel, string> = { 0: 'Основа', 1: 'Базовый', 2: 'Средний', 3: 'Сложный' };

export const STATUS_LABEL: Record<TopicStatus, string> = {
  notStarted: 'Не начато',
  foundation: 'Основа',
  learning: 'Учу',
  practicing: 'Тренирую',
  mastered: 'Освоено',
};

const STATUS_TONE: Record<TopicStatus, string> = {
  notStarted: 'bg-white/8 text-muted',
  foundation: 'bg-pink/15 text-[#f9a8d4]',
  learning: 'bg-yellow/15 text-yellow',
  practicing: 'bg-violet/20 text-[#d8b4fe]',
  mastered: 'bg-lime/15 text-lime',
};

/** Four segments (0–3); filled up to the current level, the current one glows. */
export function LevelLadder({ level, status }: { level: PlanLevel; status: TopicStatus }) {
  return (
    <div className="flex gap-1" role="img" aria-label={`Уровень: ${LEVEL_NAMES[level]}`}>
      {([0, 1, 2, 3] as const).map((l) => {
        const done = status === 'mastered' || l < level;
        const current = status !== 'mastered' && l === level;
        return (
          <span
            key={l}
            className={`h-2 flex-1 rounded-full ${done ? 'bg-lime' : current ? 'bg-gradient-to-r from-violet to-magenta shadow-[0_0_10px_#D946EF]' : 'bg-white/10'}`}
          />
        );
      })}
    </div>
  );
}

export function StatusPill({ status }: { status: TopicStatus }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_TONE[status]}`}>{STATUS_LABEL[status]}</span>;
}
