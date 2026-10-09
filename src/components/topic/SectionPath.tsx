import { motion, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';

export interface PathNode {
  label: string;
  done: boolean;
}

/** Three-step path (Понятие → Формулы → Задачи) joined by a glowing line. */
export function SectionPath({ nodes }: { nodes: PathNode[] }) {
  const reduce = useReducedMotion();
  const current = nodes.findIndex((n) => !n.done);
  return (
    <ol className="relative grid grid-cols-3" aria-label="Путь по секциям">
      <span className="absolute top-6 right-[16.6%] left-[16.6%] h-0.5 bg-white/10" aria-hidden="true" />
      <span
        className="absolute top-6 left-[16.6%] h-0.5 bg-gradient-to-r from-violet to-magenta shadow-[0_0_10px_#D946EF]"
        style={{ width: `${(Math.max(0, current === -1 ? nodes.length - 1 : current) / (nodes.length - 1)) * 66.8}%` }}
        aria-hidden="true"
      />
      {nodes.map((n, i) => {
        const isCurrent = i === current;
        return (
          <li key={n.label} className="relative flex flex-col items-center gap-2" aria-current={isCurrent ? 'step' : undefined}>
            <motion.span
              className={`grid size-12 place-items-center rounded-full font-display font-bold ${
                n.done
                  ? 'bg-selected text-white shadow-glow-strong'
                  : isCurrent
                    ? 'bg-surface-high text-ink ring-2 ring-magenta'
                    : 'bg-surface text-faint ring-1 ring-line'
              }`}
              animate={isCurrent && !reduce ? { boxShadow: ['0 0 0px #D946EF', '0 0 24px #D946EF', '0 0 0px #D946EF'] } : undefined}
              transition={isCurrent ? { duration: 2, repeat: Infinity } : undefined}
            >
              {n.done ? <Check size={22} aria-hidden="true" /> : i + 1}
            </motion.span>
            <span className={`text-sm font-medium ${n.done || isCurrent ? 'text-ink' : 'text-faint'}`}>{n.label}</span>
            <span className="sr-only">{n.done ? 'пройдено' : isCurrent ? 'текущий шаг' : 'впереди'}</span>
          </li>
        );
      })}
    </ol>
  );
}
