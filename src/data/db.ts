// Local-first persistence in IndexedDB via Dexie.
import Dexie, { type Table } from 'dexie';
import type { ErrorKind } from '../../content/types.ts';
import type { SrsState } from '@/lib/srs.ts';
import type { LessonCounter, Subscription } from '@/lib/subscription.ts';

export type Mode = 'diagnostic' | 'practice' | 'duel' | 'guided';

export interface Settings {
  sounds: boolean;
  notifications: boolean;
  reducedMotion: boolean;
}

export interface DiagnosticResult {
  date: string;
  /** Completion time in ms; tells apart several runs on the same day. Missing on old records. */
  takenAt?: number;
  correct: number;
  total: number;
  predicted: number;
  max: number;
  byTopic: Record<string, { correct: number; total: number }>;
}

/** Result of the short starting diagnostic (6 tasks, 7 minutes). */
export interface QuickDiagnosticResult {
  date: string;
  takenAt: number;
  correct: number;
  total: number;
  /** Score on the 19-point scale of part 1: ceil(correct · 19 / 6). */
  score: number;
  /** Per block; older records may hold other block names. */
  blocks: Record<string, { correct: number; total: number }>;
  /** How many times the start test has been taken. */
  runs?: number;
}

/** Account mirror kept on the device so the learner can sign in offline. */
export interface Account {
  email: string;
  salt: string;
  hash: string;
  createdAt: number;
}

export interface Profile {
  id: 'me';
  name: string;
  account?: Account;
  xp: number;
  streak: number;
  best: number;
  freezes: number;
  lastActive: string | null;
  activeDays: string[];
  challengeStart: string | null;
  diagnostic: DiagnosticResult | null;
  /** Short starting diagnostic; null until taken (required right after registration). */
  quickDiagnostic?: QuickDiagnosticResult | null;
  /** All diagnostic runs, oldest first (latest also in `diagnostic`). Missing on old records. */
  diagnosticHistory?: DiagnosticResult[];
  /** XP earned in the current week, for the class league. */
  weekly: { week: string; xp: number };
  /** Chosen plan; absent = trial for the first month, then free. */
  subscription?: Subscription;
  /** Completed lessons in the current calendar month. */
  lessons?: LessonCounter;
  /** When the welcome gift (first month on max) was shown; absent = not yet. */
  giftShownAt?: number;
  settings: Settings;
  updatedAt: number;
}

export interface TopicState {
  topicId: string;
  mastery: number;
  rating: number;
  attempts: number;
  conceptRead: boolean;
  updatedAt: number;
}

export interface Attempt {
  id: string;
  taskId: string;
  topicId: string;
  mode: Mode;
  /** Task difficulty level 0–3; missing on records from before levels were stored. */
  level?: number;
  result: number; // 1, 0.5 or 0
  answer: string;
  errorKind?: ErrorKind;
  xp: number;
  masteryAfter: number;
  date: string; // local date
  ts: number;
}

export interface CardState extends SrsState {
  id: string; // formula card id
  topicId: string;
  updatedAt: number;
}

export interface Note {
  id: string;
  topicId: string;
  kind: ErrorKind;
  text: string;
  taskText: string;
  createdAt: number;
}

export type DuelStatus = 'yourTurn' | 'waiting' | 'won' | 'lost' | 'draw';

export interface Duel {
  id: string;
  opponentId: string;
  seed: string;
  taskIds: string[];
  mine: number[]; // points per task
  theirs: number[];
  /** Opponent's per-task success chance used for this duel, and how it compares with the learner. */
  opponentProbability?: number;
  opponentSkill?: 'easier' | 'even' | 'harder';
  status: DuelStatus;
  createdAt: number;
  updatedAt: number;
}

export interface Meta {
  key: string;
  value: string | number;
}

class EvrikaDb extends Dexie {
  profile!: Table<Profile, string>;
  topics!: Table<TopicState, string>;
  attempts!: Table<Attempt, string>;
  cards!: Table<CardState, string>;
  notes!: Table<Note, string>;
  duels!: Table<Duel, string>;
  meta!: Table<Meta, string>;

  constructor() {
    super('evrika');
    this.version(1).stores({
      profile: 'id',
      topics: 'topicId, updatedAt',
      attempts: 'id, topicId, date, ts, mode',
      cards: 'id, topicId, due, updatedAt',
      notes: 'id, topicId, kind, createdAt',
      duels: 'id, status, updatedAt',
      meta: 'key',
    });
  }
}

export const db = new EvrikaDb();

export const uid = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
