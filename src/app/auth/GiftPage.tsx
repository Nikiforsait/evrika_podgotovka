import { motion } from 'framer-motion';
import { Check, Gift } from 'lucide-react';
import { useState } from 'react';
import { Confetti } from '@/components/game/Confetti.tsx';
import { Immersive } from '@/components/layout/AppShell.tsx';
import { Button } from '@/components/primitives/Button.tsx';
import { Card } from '@/components/primitives/Card.tsx';
import { updateProfile } from '@/data/profile.ts';
import { currentSubscription } from '@/data/subscription.ts';
import { useProfile } from '@/hooks/data.ts';
import { plural } from '@/lib/format.ts';
import { daysLeft, planById, TRIAL_DAYS } from '@/lib/subscription.ts';

/** Shown once after registration: the first month on the max plan is a gift. */
export default function GiftPage() {
  const profile = useProfile();
  const sub = currentSubscription(profile);
  const plan = planById('max');
  const days = daysLeft(sub.until) ?? TRIAL_DAYS;
  const until = sub.until ? new Date(sub.until).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
  const [busy, setBusy] = useState(false);

  const claim = async () => {
    setBusy(true);
    await updateProfile({ giftShownAt: Date.now() }); // AuthGate then moves on to the start test
  };

  return (
    <Immersive>
      <Confetti />
      <div className="relative flex w-full max-w-sm flex-col items-center text-center">
        <motion.span
          className="grid size-24 place-items-center rounded-full bg-lime/15 text-lime shadow-glow-strong"
          initial={{ scale: 0, rotate: -25 }}
          animate={{ scale: [0, 1.2, 0.95, 1], rotate: [-25, 10, -5, 0] }}
          transition={{ duration: 0.9, delay: 0.2, ease: 'easeOut' }}
        >
          <Gift size={48} aria-hidden="true" />
        </motion.span>
        <p className="mt-8 text-[15px] text-muted">{profile.name}, с регистрацией!</p>
        <motion.h1
          className="mt-2 font-display text-[40px] leading-tight font-bold tracking-tight sm:text-5xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          Тебе подарок
        </motion.h1>
        <motion.div className="mt-6 w-full" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.5 }}>
          <Card glow="strong" className="p-5 text-left">
            <p className="text-sm text-muted">Подписка «{plan.name}»</p>
            <p className="font-display text-2xl font-bold">{TRIAL_DAYS} дней бесплатно</p>
            <p className="mt-2 text-[15px]">
              Действует до <span className="num font-semibold text-[#e879f9]">{until}</span> · осталось {days} {plural(days, ['день', 'дня', 'дней'])}
            </p>
            <ul className="mt-3 space-y-1.5 text-sm">
              {plan.perks.map((perk) => (
                <li key={perk} className="flex gap-2">
                  <Check size={16} className="mt-0.5 shrink-0 text-lime" aria-hidden="true" />
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>
        <Button full className="mt-6 min-h-16 text-lg" disabled={busy} onClick={() => void claim()}>
          Забрать подарок
        </Button>
        <p className="mt-4 text-sm text-muted">Когда подарок закончится, продолжишь на бесплатном тарифе или выберешь подписку в профиле.</p>
      </div>
    </Immersive>
  );
}
