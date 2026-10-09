import { Check, CreditCard } from 'lucide-react';
import { useState } from 'react';
import type { Profile } from '@/data/db.ts';
import { choosePlan, currentSubscription, lessonsRemaining } from '@/data/subscription.ts';
import { daysLeft, formatPrice, lessonsUsed, PLANS, planById, type PlanId } from '@/lib/subscription.ts';
import { plural } from '@/lib/format.ts';
import { Button } from '../primitives/Button.tsx';
import { Card, Section } from '../primitives/Card.tsx';
import { Pill } from '../primitives/Pill.tsx';

const STATUS_LABEL = { trial: 'подарок: первый месяц', active: 'активна', demo: 'демо-режим, оплата не подключена' } as const;
/** Lower plans are part of a higher one, so they are never offered for purchase. */
const RANK: Record<PlanId, number> = { free: 0, standard: 1, max: 2 };
const untilText = (until: number | null) => (until ? new Date(until).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' }) : '');

/** Profile block: the current plan, lessons left this month and the three plans with stub checkout. */
export function SubscriptionSection({ profile }: { profile: Profile }) {
  const sub = currentSubscription(profile);
  const plan = planById(sub.plan);
  const left = lessonsRemaining(profile);
  const used = lessonsUsed(profile.lessons);
  const days = daysLeft(sub.until);
  const [busy, setBusy] = useState<PlanId | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const pick = async (id: PlanId) => {
    setBusy(id);
    setNotice(null);
    const outcome = await choosePlan(id);
    setBusy(null);
    if (outcome === 'demo') {
      setNotice(id === 'free' ? 'Переключились на бесплатную подписку.' : `Подписка «${planById(id).name}» включена в демо-режиме: оплата появится после подключения платёжного сервиса.`);
    }
  };

  return (
    <Section title="Подписка">
      <Card glow="strong" className="p-5 sm:p-6" as="section" aria-label="Текущая подписка">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-muted">Текущий тариф</p>
            <h3 className="font-display text-xl font-bold">{plan.name}</h3>
          </div>
          <Pill tone={sub.status === 'trial' ? 'lime' : 'violet'}>{STATUS_LABEL[sub.status]}</Pill>
        </div>
        <p className="mt-3 text-[15px]">
          {left === null ? 'Уроки без ограничений' : `Осталось ${left} ${plural(left, ['урок', 'урока', 'уроков'])} из ${plan.lessonsPerMonth} в этом месяце`}
          {used > 0 && ` · пройдено ${used}`}
        </p>
        {days !== null && (
          <p className="mt-1 text-sm text-muted">
            {sub.status === 'trial' ? `Подарок за регистрацию: максимальная подписка до ${untilText(sub.until)}, ещё ${days} ${plural(days, ['день', 'дня', 'дней'])}. Затем бесплатный тариф.` : `Действует до ${untilText(sub.until)}, ещё ${days} ${plural(days, ['день', 'дня', 'дней'])}.`}
          </p>
        )}
      </Card>

      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {PLANS.map((p) => {
          // The plan in force (paid, demo or the welcome gift) is never offered for purchase again.
          const current = p.id === plan.id;
          const included = RANK[p.id] < RANK[plan.id];
          return (
            <li key={p.id}>
              <Card className={`flex h-full flex-col p-5 ${p.id === 'max' ? 'ring-1 ring-lime/50' : ''}`}>
                <h4 className="font-display text-base font-semibold">{p.name}</h4>
                <p className="num mt-1 font-display text-2xl font-bold">{formatPrice(p.price)}</p>
                <p className="text-sm text-muted">{p.tagline}</p>
                <ul className="mt-3 flex-1 space-y-1.5 text-sm">
                  {p.perks.map((perk) => (
                    <li key={perk} className="flex gap-2">
                      <Check size={16} className="mt-0.5 shrink-0 text-lime" aria-hidden="true" />
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
                <Button variant={current || included ? 'ghost' : p.id === 'max' ? 'cta' : 'soft'} full className="mt-4" disabled={current || included || busy !== null} onClick={() => void pick(p.id)}>
                  {current ? (sub.status === 'trial' ? 'Ваш тариф · подарок' : 'Ваш тариф') : included ? 'Входит в ваш тариф' : busy === p.id ? 'Подключаем…' : p.price === 0 ? 'Выбрать' : <><CreditCard size={18} aria-hidden="true" /> Оформить</>}
                </Button>
              </Card>
            </li>
          );
        })}
      </ul>
      {notice && (
        <p role="status" className="mt-3 rounded-inner bg-violet/12 px-4 py-3 text-[15px] ring-1 ring-violet/40">
          {notice}
        </p>
      )}
    </Section>
  );
}
