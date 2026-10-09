import { CheckCircle2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Page } from '@/components/layout/AppShell.tsx';
import { ButtonLink } from '@/components/primitives/Button.tsx';
import { Card, Section } from '@/components/primitives/Card.tsx';
import { GaugeRing } from '@/components/primitives/GaugeRing.tsx';
import { Pill } from '@/components/primitives/Pill.tsx';
import { BLOCK_LABEL, BLOCKS, QUICK_MAX } from '@/data/quickDiagnostic.ts';
import { useProfile } from '@/hooks/data.ts';

export default function StartResultPage() {
  const profile = useProfile();
  const result = profile.quickDiagnostic;
  if (profile.updatedAt && !result) return <Navigate to="/start" replace />;
  if (!result) return <Page><p className="mt-10 text-center text-muted" role="status">Считаем результат…</p></Page>;
  const fullDone = profile.diagnostic !== null;

  return (
    <Page>
      <div className="flex justify-center pt-6">
        <Pill tone="lime">
          <CheckCircle2 size={16} aria-hidden="true" /> Стартовый тест пройден
        </Pill>
      </div>

      <div className="mt-6 flex flex-col items-center">
        <p className="text-[15px] text-muted">Твой стартовый балл</p>
        <div className="mt-3">
          <GaugeRing value={result.score / QUICK_MAX} label={`Стартовый балл ${result.score} из ${QUICK_MAX}`}>
            <div>
              <p className="num font-display text-[52px] leading-none font-bold">
                {result.score} <span className="text-faint">/</span> {QUICK_MAX}
              </p>
              <p className="mt-2 text-[15px] text-muted">по шкале первой части</p>
            </div>
          </GaugeRing>
        </div>
        <p className="mt-4 max-w-sm text-center text-sm text-muted">
          {fullDone ? 'План строится по полной диагностике, стартовый тест его не меняет.' : 'План на неделю подстроен под этот результат. Дальше балл растёт с каждой тренировкой.'}
        </p>
      </div>

      <Section title="По блокам">
        <Card className="space-y-3 p-4 sm:p-5">
          {BLOCKS.filter((b) => result.blocks[b]).map((b) => {
            const r = result.blocks[b]!;
            const ok = r.correct === r.total;
            return (
              <div key={b} className="flex items-center justify-between gap-3 text-[15px]">
                <span>{BLOCK_LABEL[b]}</span>
                <span className={`rounded-full px-3 py-1 text-sm ${ok ? 'bg-lime/15 text-lime' : r.correct ? 'bg-yellow/15 text-yellow' : 'bg-pink/15 text-pink'}`}>
                  {ok ? 'освоено' : r.correct ? 'частично' : 'стоит подтянуть'}
                </span>
              </div>
            );
          })}
        </Card>
      </Section>

      <div className="mt-6 space-y-2">
        <ButtonLink to="/" full>К плану и тренировкам</ButtonLink>
        <ButtonLink to="/start" variant="ghost" full>
          Пройти стартовый тест ещё раз
        </ButtonLink>
        <ButtonLink to="/diagnostic" variant="ghost" full>
          Полная диагностика (19 заданий)
        </ButtonLink>
      </div>
    </Page>
  );
}
