import type { Task } from '../../../content/types.ts';
import { MathText } from '../primitives/MathText.tsx';
import { topicById } from '@/data/topics.ts';

export const LEVEL_LABEL = { 0: 'Основа', 1: 'Базовый', 2: 'Средний', 3: 'Сложный' } as const;

/** The problem statement card with highlighted numbers. */
export function QuestionCard({ task }: { task: Task }) {
  return (
    <section
      aria-label="Условие задачи"
      className="rounded-card bg-surface p-6 shadow-[var(--shadow-glow),var(--shadow-inner-glow)] sm:p-7"
    >
      <p className="mb-3 text-[13px] text-muted">
        Задание {topicById(task.topicId)?.number} · {topicById(task.topicId)?.short} · {LEVEL_LABEL[task.level]}
      </p>
      {task.figure && (
        <img
          src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(task.figure)}`}
          alt={task.figureAlt ?? 'Рисунок к задаче'}
          className="mx-auto mb-4 block h-auto max-w-full"
          style={{ maxHeight: 300 }}
        />
      )}
      {task.table && (
        <div className="mb-4 overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full border-collapse text-[14px]">
            <thead>
              <tr>
                {task.table.head.map((h) => (
                  <th key={h} scope="col" className="border-b border-white/10 bg-white/5 px-3 py-2 text-left font-medium text-muted">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {task.table.rows.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j} className="border-b border-white/5 px-3 py-2 tabular-nums">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-[19px] leading-relaxed font-bold sm:text-xl">
        <MathText text={task.text} />
      </p>
      <p className="mt-3 text-[16px] italic text-ink/90">
        <MathText text={task.question} />
      </p>
    </section>
  );
}
