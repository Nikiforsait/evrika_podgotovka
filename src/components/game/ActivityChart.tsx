import type { DayActivity } from '@/data/stats.ts';

const DAY = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });

/** Daily solved-task bars (custom SVG), with an accessible text summary. */
export function ActivityChart({ data }: { data: DayActivity[] }) {
  const max = Math.max(1, ...data.map((d) => d.tasks));
  const total = data.reduce((s, d) => s + d.tasks, 0);
  const correct = data.reduce((s, d) => s + d.correct, 0);
  const w = 100 / Math.max(1, data.length);
  const first = data[0];
  const last = data[data.length - 1];

  return (
    <figure>
      <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-32 w-full" aria-hidden="true">
        {data.map((d, i) => {
          const h = (d.tasks / max) * 36;
          const hc = (d.correct / max) * 36;
          return (
            <g key={d.date}>
              <rect x={i * w + w * 0.15} y={40 - Math.max(h, 0.8)} width={w * 0.7} height={Math.max(h, 0.8)} rx={Math.min(1.2, w * 0.3)} fill="rgb(168 85 247 / 0.3)" />
              <rect x={i * w + w * 0.15} y={40 - hc} width={w * 0.7} height={hc} rx={Math.min(1.2, w * 0.3)} fill="#A855F7" />
            </g>
          );
        })}
      </svg>
      {first && last && (
        <div className="mt-1 flex justify-between text-xs text-faint" aria-hidden="true">
          <span>{DAY.format(new Date(first.date))}</span>
          <span>{DAY.format(new Date(last.date))}</span>
        </div>
      )}
      <figcaption className="mt-2 text-sm text-muted">
        Решено заданий: <strong className="text-ink">{total}</strong>, из них верно:{' '}
        <strong className="text-ink">{correct}</strong>
      </figcaption>
    </figure>
  );
}
