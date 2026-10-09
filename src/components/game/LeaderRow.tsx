import type { LeaderRow as Row } from '@/data/duels.ts';
import { Avatar } from '../primitives/Avatar.tsx';

const MEDAL = ['#FACC15', '#CBD5E1', '#FB923C'];

/** One row of the class league; the learner's row is outlined in violet. */
export function LeaderRow({ row, rank }: { row: Row; rank: number }) {
  return (
    <li
      className={`flex min-h-14 items-center gap-3 rounded-inner px-4 ${
        row.isMe ? 'bg-violet/15 ring-2 ring-violet shadow-glow-strong' : 'bg-surface ring-1 ring-line'
      }`}
      aria-current={row.isMe ? 'true' : undefined}
    >
      <span className="num w-6 text-center font-display font-bold" style={{ color: MEDAL[rank - 1] ?? 'var(--color-muted)' }}>
        {rank}
      </span>
      <Avatar name={row.name} hue={row.hue} size={32} />
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium">
          {row.name}
          {row.isMe && <span className="text-muted"> (ты)</span>}
        </span>
        <span className="text-xs font-semibold" style={{ color: row.leagueColor }}>{row.league}</span>
      </span>
      <span className="num font-mono font-semibold">{row.xp} XP</span>
    </li>
  );
}
