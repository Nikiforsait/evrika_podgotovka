// Weekly leagues: the tier depends only on XP earned since Monday and resets every week.

export interface League {
  id: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  name: string;
  minXp: number;
  color: string;
}

export const LEAGUES: League[] = [
  { id: 'bronze', name: 'Бронза', minXp: 0, color: '#CD7F32' },
  { id: 'silver', name: 'Серебро', minXp: 150, color: '#CBD5E1' },
  { id: 'gold', name: 'Золото', minXp: 400, color: '#FACC15' },
  { id: 'platinum', name: 'Платина', minXp: 800, color: '#22D3EE' },
  { id: 'diamond', name: 'Алмаз', minXp: 1500, color: '#D946EF' },
];

export function leagueFor(weeklyXp: number): League {
  let current = LEAGUES[0]!;
  for (const l of LEAGUES) if (weeklyXp >= l.minXp) current = l;
  return current;
}

export function nextLeague(weeklyXp: number): League | null {
  return LEAGUES.find((l) => l.minXp > weeklyXp) ?? null;
}

/** Progress inside the current league (0..1); 1 when already in the top league. */
export function leagueProgress(weeklyXp: number): number {
  const cur = leagueFor(weeklyXp);
  const next = nextLeague(weeklyXp);
  if (!next) return 1;
  return Math.min(1, Math.max(0, (weeklyXp - cur.minXp) / (next.minXp - cur.minXp)));
}

/** Days until the league week ends (Sunday inclusive): Monday → 7, Sunday → 1. */
export function daysLeftInWeek(now = new Date()): number {
  const dow = (now.getDay() + 6) % 7; // Monday = 0
  return 7 - dow;
}
