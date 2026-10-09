// Subscription plans and lesson limits (pure functions; storage lives in data/subscription.ts).
// A "lesson" is one completed training session (a practice set from the plan or a topic).

export type PlanId = 'free' | 'standard' | 'max';

export interface Plan {
  id: PlanId;
  name: string;
  /** Price per month in rubles; 0 = free. */
  price: number;
  /** Lessons per calendar month; null = unlimited. */
  lessonsPerMonth: number | null;
  tagline: string;
  perks: string[];
}

export const TRIAL_DAYS = 30;

/**
 * Limits follow the plan: 3 training blocks a day ≈ 90 lessons a month.
 *  - free: 12 lessons ≈ 3 a week — enough to feel the product, not to prepare;
 *  - standard: 60 lessons = 2 a day — the full weekly plan on most days;
 *  - max: unlimited — the whole daily plan, extra practice and duels without counting.
 */
export const PLANS: Plan[] = [
  { id: 'free', name: 'Бесплатная', price: 0, lessonsPerMonth: 12, tagline: '3 урока в неделю', perks: ['12 уроков в месяц', 'Стартовый тест и полная диагностика', 'Справочник формул'] },
  { id: 'standard', name: 'Стандартная', price: 103, lessonsPerMonth: 60, tagline: '2 урока в день', perks: ['60 уроков в месяц', 'Индивидуальный план на неделю', 'Дуэли и лиги'] },
  { id: 'max', name: 'Максимальная', price: 148, lessonsPerMonth: null, tagline: 'без ограничений', perks: ['Уроки без ограничений', 'Весь план на день и дополнительная практика', 'Дуэли, лиги и вызов «100 дней»'] },
];

export const planById = (id: PlanId): Plan => PLANS.find((p) => p.id === id) ?? PLANS[0]!;

export interface Subscription {
  plan: PlanId;
  /** 'trial' = first month free on the max plan; 'demo' = chosen through the payment stub. */
  status: 'trial' | 'active' | 'demo';
  since: number;
  /** Expiry in ms; null = does not expire (free plan). */
  until: number | null;
}

export interface LessonCounter {
  month: string; // YYYY-MM
  used: number;
}

export const monthKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/** First month on the max plan for free, counted from the account's creation. */
export function trialSubscription(accountCreatedAt: number): Subscription {
  return { plan: 'max', status: 'trial', since: accountCreatedAt, until: accountCreatedAt + TRIAL_DAYS * 86_400_000 };
}

/** The plan in force right now: a paid/demo plan, else the trial while it lasts, else free. */
export function effectiveSubscription(stored: Subscription | undefined, accountCreatedAt: number | undefined, now = Date.now()): Subscription {
  if (stored && (stored.until === null || stored.until > now) && stored.status !== 'trial') return stored;
  if (accountCreatedAt !== undefined) {
    const trial = trialSubscription(accountCreatedAt);
    if (trial.until! > now) return trial;
  }
  return { plan: 'free', status: 'active', since: accountCreatedAt ?? now, until: null };
}

export function lessonsUsed(counter: LessonCounter | undefined, now = new Date()): number {
  return counter && counter.month === monthKey(now) ? counter.used : 0;
}

/** Lessons still available this month; null = unlimited. */
export function lessonsLeft(plan: Plan, counter: LessonCounter | undefined, now = new Date()): number | null {
  if (plan.lessonsPerMonth === null) return null;
  return Math.max(0, plan.lessonsPerMonth - lessonsUsed(counter, now));
}

export const daysLeft = (until: number | null, now = Date.now()) => (until === null ? null : Math.max(0, Math.ceil((until - now) / 86_400_000)));

export const formatPrice = (price: number) => (price === 0 ? 'бесплатно' : `${price} ₽ в месяц`);
