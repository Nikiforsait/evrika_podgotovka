import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Page } from '@/components/layout/AppShell.tsx';
import { PlanBlockCard } from '@/components/plan/PlanBlockCard.tsx';
import { LevelLadder, StatusPill } from '@/components/plan/LevelLadder.tsx';
import { ButtonLink } from '@/components/primitives/Button.tsx';
import { Card, Section } from '@/components/primitives/Card.tsx';
import { ProgressBar } from '@/components/primitives/ProgressBar.tsx';
import { Tabs } from '@/components/primitives/Tabs.tsx';
import { usePlan } from '@/hooks/plan.ts';
import { usePrediction, useProfile } from '@/hooks/data.ts';
import { plural } from '@/lib/format.ts';
import { WeekMap } from './WeekMap.tsx';

type View = 'today' | 'map';

export default function PlanPage() {
  const plan = usePlan();
  const profile = useProfile();
  const prediction = usePrediction();
  const [view, setView] = useState<View>('today');

  if (!plan) return <Page><p className="mt-10 text-center text-muted" role="status">Составляем план…</p></Page>;

  const hasDiagnostic = profile.diagnostic !== null;
  const doneBlocks = plan.today.filter((b) => b.done >= b.count).length;

  return (
    <Page wide>
      <header className="pt-8">
        <h1 className="font-display text-2xl font-bold">Твой план</h1>
        <p className="mt-1 text-[15px] text-muted">
          Освоено {plan.mastered} из {plan.total} заданий · прогноз {prediction.score} из {prediction.max}
        </p>
        <ProgressBar value={plan.mastered / plan.total} label={`Освоено ${plan.mastered} из ${plan.total}`} className="mt-3" height={8} color="#A3E635" />
      </header>

      {!hasDiagnostic && (
        <Card glow="strong" className="mt-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
          <p className="min-w-0 text-[15px] sm:flex-1">План точнее после полной диагностики: по одному вопросу на каждое задание, без таймера.</p>
          <ButtonLink to="/diagnostic" variant="pill" className="self-start sm:self-auto">Пройти диагностику</ButtonLink>
        </Card>
      )}

      <Tabs label="Раздел плана" value={view} onChange={setView} className="mt-6" options={[{ value: 'today', label: 'Сегодня' }, { value: 'map', label: 'Карта заданий' }]} />

      {view === 'today' ? (
        <>
          <Section title="Сегодня" action={<span className="text-sm text-muted">{doneBlocks} из {plan.today.length} блоков</span>}>
            <div className="space-y-3">
              {plan.today.map((b, i) => (
                <PlanBlockCard key={`${b.kind}-${b.topicId}`} block={b} index={i} />
              ))}
            </div>
            <p className="mt-3 text-sm text-faint">Каждый блок — около 5 минут. Уровень подбирается по твоим последним ответам: 4 верных из 5 — и уровень растёт.</p>
          </Section>
          <Section title="Неделя">
            <WeekMap plan={plan} />
          </Section>
        </>
      ) : (
        <Section title="Все 19 заданий">
          <ul className="grid gap-3 sm:grid-cols-2">
            {plan.topics.map((t) => (
              <li key={t.id}>
                <Link to={`/topics/${t.id}`} className="block rounded-inner bg-surface p-4 shadow-glow transition-shadow hover:shadow-glow-strong">
                  <div className="flex items-start gap-3">
                    <span className="num grid size-9 shrink-0 place-items-center rounded-xl bg-violet/15 font-display text-sm font-bold text-[#d8b4fe]">{t.number}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="truncate text-[15px] font-semibold">{t.title}</h3>
                        <StatusPill status={t.status} />
                      </div>
                      <LevelLadder level={t.level} status={t.status} />
                      <p className="mt-2 text-[13px] leading-snug text-muted">{t.nextStep}</p>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-faint">
            Шкала: основа → базовый → средний → сложный. {plural(plan.total - plan.mastered, ['задание ждёт', 'задания ждут', 'заданий ждут'])} работы: {plan.total - plan.mastered}.
          </p>
        </Section>
      )}
    </Page>
  );
}
