import { Link } from 'react-router-dom';
import { masteryTone } from '@/design-system/tokens.ts';
import { masteryLevel } from '@/lib/predict.ts';
import { percent } from '@/lib/format.ts';
import { Pill } from '../primitives/Pill.tsx';
import { ProgressBar } from '../primitives/ProgressBar.tsx';

const PILL_TONE = { low: 'pink', medium: 'yellow', high: 'lime' } as const;

interface TopicProgressRowProps {
  title: string;
  value: number; // 0..1
  to?: string;
  showStatus?: boolean;
}

/** Topic name, color-coded bar and a status tag (низкий / средний / высокий). */
export function TopicProgressRow({ title, value, to, showStatus = true }: TopicProgressRowProps) {
  const level = masteryLevel(value);
  const tone = masteryTone[level];
  const body = (
    <>
      <span className="w-32 shrink-0 truncate text-[15px] font-medium sm:w-40">{title}</span>
      <ProgressBar value={value} color={tone.color} label={`${title}: ${percent(value)}`} className="flex-1" />
      {showStatus ? (
        <Pill tone={PILL_TONE[level]} className="w-[88px] justify-center">
          {tone.label}
        </Pill>
      ) : (
        <span className="num w-12 text-right font-mono text-sm font-semibold">{percent(value)}</span>
      )}
    </>
  );
  const cls = 'flex min-h-12 items-center gap-3';
  return to ? (
    <Link to={to} className={`${cls} -mx-2 rounded-xl px-2 hover:bg-white/5`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
