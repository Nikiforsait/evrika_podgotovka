// Asynchronous duels: both sides solve the same five tasks. Each correct
// answer is one point. The opponent's answers are revealed task by task.
import type { Task } from '../../content/types.ts';
import { createRng, pick, shuffle } from '@/lib/rng.ts';
import { opponentProbability, recentBalance, skillLabel, type DuelOutcome } from '@/lib/duelBalance.ts';
import { leagueFor } from '@/lib/leagues.ts';
import { CLASSMATES, classmateById, classmateWeeklyXp, weekKey } from './classmates.ts';
import { db, uid, type Duel, type DuelStatus } from './db.ts';
import { addXpAndActivity, DEFAULT_PROFILE } from './profile.ts';

export const DUEL_LENGTH = 5;
export const DUEL_XP: Record<'won' | 'draw' | 'lost', number> = { won: 25, draw: 15, lost: 10 };

const total = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Learner's recent accuracy on scored tasks (null until there is enough history). */
async function recentAccuracy(limit = 30): Promise<number | null> {
  const rows = await db.attempts.orderBy('ts').reverse().filter((a) => a.mode !== 'diagnostic').limit(limit).toArray();
  if (rows.length < 5) return null;
  return rows.filter((a) => a.result >= 1).length / rows.length;
}

async function recentOutcomes(): Promise<DuelOutcome[]> {
  const rows = await db.duels.orderBy('updatedAt').toArray();
  return rows.map((d) => d.status).filter((s): s is DuelOutcome => s === 'won' || s === 'lost' || s === 'draw');
}

export async function createDuel(tasks: Task[], opponentId?: string): Promise<Duel> {
  const seed = uid();
  const rng = createRng(seed);
  const opponent = opponentId ? classmateById(opponentId) : pick(rng, CLASSMATES);
  if (!opponent) throw new Error(`Unknown opponent ${opponentId}`);
  const pool = tasks.filter((t) => t.level === 2);
  const chosen = shuffle(rng, pool).slice(0, DUEL_LENGTH);
  // Balance: the opponent is about as good as the learner, a bit stronger after wins, weaker after losses.
  const accuracy = await recentAccuracy();
  const probability = opponentProbability(accuracy, recentBalance(await recentOutcomes()));
  const duel: Duel = {
    id: seed,
    opponentId: opponent.id,
    seed,
    taskIds: chosen.map((t) => t.id),
    mine: [],
    theirs: chosen.map((t) => (createRng(`${seed}:${t.id}`)() < probability ? 1 : 0)),
    opponentProbability: probability,
    opponentSkill: skillLabel(probability, accuracy),
    status: 'yourTurn',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  await db.duels.put(duel);
  return duel;
}

/** Score as visible to the player: the opponent's points only for played tasks. */
export function visibleScore(duel: Duel): { mine: number; theirs: number } {
  return { mine: total(duel.mine), theirs: total(duel.theirs.slice(0, duel.mine.length)) };
}

function finalStatus(duel: Duel): DuelStatus {
  const mine = total(duel.mine);
  const theirs = total(duel.theirs);
  if (mine > theirs) return 'won';
  if (mine < theirs) return 'lost';
  return 'draw';
}

/** Record one answer in a duel; finishes the duel after the last task. */
export async function playDuelTask(duelId: string, correct: boolean): Promise<Duel> {
  const duel = await db.duels.get(duelId);
  if (!duel || duel.status !== 'yourTurn') throw new Error('Duel is not playable');
  const mine = [...duel.mine, correct ? 1 : 0];
  const done = mine.length >= duel.taskIds.length;
  const next: Duel = { ...duel, mine, updatedAt: Date.now() };
  if (done) {
    next.status = finalStatus(next);
    await addXpAndActivity(DUEL_XP[next.status as 'won' | 'draw' | 'lost']);
  }
  await db.duels.put(next);
  return next;
}

export interface LeaderRow {
  id: string;
  name: string;
  xp: number;
  hue: number;
  isMe: boolean;
  league: string; // league name for the chip
  leagueColor: string;
}

/** Weekly class league: practice opponents plus the learner's XP this week. */
export async function leaderboard(now = new Date()): Promise<LeaderRow[]> {
  const me = (await db.profile.get('me')) ?? DEFAULT_PROFILE; // read-only inside liveQuery
  const myXp = me.weekly?.week === weekKey(now) ? me.weekly.xp : 0;
  const withLeague = (xp: number) => ({ league: leagueFor(xp).name, leagueColor: leagueFor(xp).color });
  const rows: LeaderRow[] = CLASSMATES.map((m) => {
    const xp = classmateWeeklyXp(m, now);
    return { id: m.id, name: m.name, xp, hue: m.hue, isMe: false, ...withLeague(xp) };
  });
  rows.push({ id: 'me', name: me.name, xp: myXp, hue: 290, isMe: true, ...withLeague(myXp) });
  return rows.sort((a, b) => b.xp - a.xp);
}
