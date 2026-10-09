import { Flame, Heart, Lock, Star, Target, Trophy, Zap } from 'lucide-react';
import type { Achievement } from '@/data/stats.ts';

const ICONS = { flame: Flame, star: Star, zap: Zap, heart: Heart, trophy: Trophy, target: Target };

/** Circular achievement badge: colored and glowing when earned, muted with a lock otherwise. */
export function AchievementIcon({ a }: { a: Achievement }) {
  const Icon = a.earned ? ICONS[a.icon] : Lock;
  return (
    <li className="flex flex-col items-center gap-2 text-center">
      <span
        className="grid size-16 place-items-center rounded-full"
        style={
          a.earned
            ? { background: `${a.color}26`, color: a.color, boxShadow: `0 0 0 2px ${a.color}, 0 0 22px -4px ${a.color}` }
            : { background: 'rgb(255 255 255 / 0.05)', color: 'var(--color-faint)', boxShadow: '0 0 0 1px var(--color-line)' }
        }
      >
        <Icon size={26} aria-hidden="true" />
      </span>
      <span className={`text-[13px] leading-tight font-semibold ${a.earned ? '' : 'text-muted'}`}>{a.title}</span>
      <span className="sr-only">{a.earned ? 'получено' : `не получено: ${a.hint}`}</span>
      {!a.earned && <span className="-mt-1 text-xs leading-tight text-faint" aria-hidden="true">{a.hint}</span>}
    </li>
  );
}
