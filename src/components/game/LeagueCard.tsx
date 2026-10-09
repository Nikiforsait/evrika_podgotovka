import { Shield } from 'lucide-react';
import { daysLeftInWeek, LEAGUES, leagueFor, leagueProgress, nextLeague } from '@/lib/leagues.ts';
import { plural } from '@/lib/format.ts';
import { Card } from '../primitives/Card.tsx';
import { ProgressBar } from '../primitives/ProgressBar.tsx';

/** Current weekly league, progress to the next one and the week countdown. */
export function LeagueCard({ weeklyXp }: { weeklyXp: number }) {
  const league = leagueFor(weeklyXp);
  const next = nextLeague(weeklyXp);
  const days = daysLeftInWeek();
  return (
    <Card as="section" aria-label="Моя лига" glow="strong" className="p-5">
      <div className="flex items-center gap-4">
        <span className="grid size-14 shrink-0 place-items-center rounded-2xl" style={{ background: `${league.color}26`, color: league.color, boxShadow: `0 0 0 2px ${league.color}, 0 0 22px -4px ${league.color}` }}>
          <Shield size={28} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">Моя лига на этой неделе</p>
          <h2 className="font-display text-xl font-bold" style={{ color: league.color }}>{league.name}</h2>
          <p className="num text-sm text-muted">{weeklyXp} XP за неделю · до конца {days} {plural(days, ['день', 'дня', 'дней'])}</p>
        </div>
      </div>
      <ProgressBar value={leagueProgress(weeklyXp)} color={league.color} label={next ? `До лиги ${next.name}: ${next.minXp - weeklyXp} XP` : 'Высшая лига'} className="mt-4" />
      <p className="mt-2 text-sm text-muted">
        {next ? `Ещё ${next.minXp - weeklyXp} XP — и ты в лиге «${next.name}».` : 'Это высшая лига. Удержи её до воскресенья!'} Лига считается заново каждый понедельник.
      </p>
      <ol className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-faint" aria-label="Пороги лиг">
        {LEAGUES.map((l) => (
          <li key={l.id} className={l.id === league.id ? 'font-semibold' : ''} style={l.id === league.id ? { color: l.color } : undefined}>
            {l.name} {l.minXp}+
          </li>
        ))}
      </ol>
    </Card>
  );
}
