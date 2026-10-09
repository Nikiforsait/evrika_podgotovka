// Subscription state in the profile and the lesson counter. Payment is a stub:
// choosePlan() activates the plan locally and marks it 'demo' until a payment
// provider is wired in (see docs/ПОДПИСКИ.md and server/api.ts → /api/pay/create).
import { effectiveSubscription, lessonsLeft, monthKey, planById, type Plan, type PlanId, type Subscription } from '@/lib/subscription.ts';
import { db, type Profile } from './db.ts';
import { getProfile, updateProfile } from './profile.ts';
import { API_URL, getToken, LOCAL_ONLY } from './auth.ts';

export function currentSubscription(profile: Profile): Subscription {
  return effectiveSubscription(profile.subscription, profile.account?.createdAt ?? (profile.updatedAt || undefined));
}

export function currentPlan(profile: Profile): Plan {
  return planById(currentSubscription(profile).plan);
}

/** Lessons left this month for the profile; null = unlimited. */
export function lessonsRemaining(profile: Profile): number | null {
  return lessonsLeft(currentPlan(profile), profile.lessons);
}

export const canStartLesson = (profile: Profile) => {
  const left = lessonsRemaining(profile);
  return left === null || left > 0;
};

/** Count one completed training session against this month's limit. */
export async function recordLesson(): Promise<void> {
  const p = await getProfile();
  const month = monthKey();
  const used = p.lessons?.month === month ? p.lessons.used : 0;
  await updateProfile({ lessons: { month, used: used + 1 } });
}

/**
 * Ask the server to start a checkout. Until a provider is connected the server
 * answers 501 and the plan is activated locally as a demo.
 */
export async function choosePlan(plan: PlanId): Promise<'paid' | 'demo'> {
  const token = await getToken();
  let paid = false;
  try {
    if (LOCAL_ONLY) throw new Error('no server');
    const res = await fetch(`${API_URL}/pay/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ plan }),
    });
    const data = (await res.json().catch(() => ({}))) as { url?: string };
    if (res.ok && data.url) {
      window.location.assign(data.url); // the provider's payment page; the webhook activates the plan
      paid = true;
    }
  } catch {
    paid = false;
  }
  if (paid) return 'paid';
  const now = Date.now();
  const subscription: Subscription = plan === 'free'
    ? { plan: 'free', status: 'active', since: now, until: null }
    : { plan, status: 'demo', since: now, until: now + 30 * 86_400_000 };
  await updateProfile({ subscription });
  await db.meta.put({ key: 'lastPlanChange', value: now });
  return 'demo';
}
