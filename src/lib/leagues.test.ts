import { describe, expect, it } from 'vitest';
import { opponentProbability, recentBalance, skillLabel } from './duelBalance.ts';
import { daysLeftInWeek, leagueFor, leagueProgress, nextLeague } from './leagues.ts';

describe('weekly leagues', () => {
  it('maps weekly XP to tiers and progress', () => {
    expect(leagueFor(0).id).toBe('bronze');
    expect(leagueFor(150).id).toBe('silver');
    expect(leagueFor(1499).id).toBe('platinum');
    expect(leagueFor(5000).id).toBe('diamond');
    expect(nextLeague(5000)).toBeNull();
    expect(leagueProgress(275)).toBeCloseTo(0.5);
    expect(leagueProgress(2000)).toBe(1);
  });
  it('counts days to Sunday', () => {
    expect(daysLeftInWeek(new Date(2026, 9, 5))).toBe(7); // Monday
    expect(daysLeftInWeek(new Date(2026, 9, 11))).toBe(1); // Sunday
  });
});

describe('duel balance', () => {
  it('nudges the opponent up after wins and down after losses', () => {
    expect(recentBalance(['won', 'won', 'lost', 'draw'])).toBe(1);
    expect(opponentProbability(0.6, 0)).toBeCloseTo(0.6);
    expect(opponentProbability(0.6, 3)).toBeCloseTo(0.75);
    expect(opponentProbability(0.6, -3)).toBeCloseTo(0.45);
    expect(opponentProbability(0.95, 5)).toBe(0.9);
    expect(opponentProbability(0.1, -5)).toBe(0.25);
    expect(opponentProbability(null, 0)).toBe(0.6);
  });
  it('labels the opponent', () => {
    expect(skillLabel(0.75, 0.6)).toBe('harder');
    expect(skillLabel(0.45, 0.6)).toBe('easier');
    expect(skillLabel(0.62, 0.6)).toBe('even');
  });
  it('keeps long-run win rate near 50% in a simulation', () => {
    // Learner with fixed 60% accuracy; opponent probability tracks balance of last 5 duels.
    let seed = 42;
    const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
    const outcomes: ('won' | 'lost' | 'draw')[] = [];
    for (let d = 0; d < 400; d++) {
      const p = opponentProbability(0.6, recentBalance(outcomes));
      let mine = 0, theirs = 0;
      for (let t = 0; t < 5; t++) { if (rnd() < 0.6) mine++; if (rnd() < p) theirs++; }
      outcomes.push(mine > theirs ? 'won' : mine < theirs ? 'lost' : 'draw');
    }
    const wins = outcomes.filter((o) => o === 'won').length;
    const losses = outcomes.filter((o) => o === 'lost').length;
    expect(wins / (wins + losses)).toBeGreaterThan(0.4);
    expect(wins / (wins + losses)).toBeLessThan(0.6);
    const longest = Math.max(...outcomes.join('').split(/(?<=won)(?!won)|(?<=lost)(?!lost)|(?<=draw)(?!draw)/).map((s) => s.length));
    expect(longest).toBeLessThan(40); // no endless streaks (≈ 8 duels of 'won' = 24 chars)
  });
});
