import { CheckCircle2 } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { Page } from '@/components/layout/AppShell.tsx';
import { ButtonLink } from '@/components/primitives/Button.tsx';
import { Card, Section } from '@/components/primitives/Card.tsx';
import { GaugeRing } from '@/components/primitives/GaugeRing.tsx';
import { Pill } from '@/components/primitives/Pill.tsx';
import { TopicProgressRow } from '@/components/topic/TopicProgressRow.tsx';
import { previousDiagnostic } from '@/data/diagnostic.ts';
import { topics } from '@/data/topics.ts';
import { useProfile, useTopicStates } from '@/hooks/data.ts';
import { compareDiagnostics } from '@/lib/diagnosticCompare.ts';
import { percent } from '@/lib/format.ts';
import { DiagnosticChanges } from './DiagnosticChanges.tsx';

export default function DiagnosticResultPage() {
  const profile = useProfile();
  const states = useTopicStates();
  const result = profile.diagnostic;
  if (profile.updatedAt && !result) return <Navigate to="/diagnostic" replace />;
  if (!result) return <Page><p className="mt-10 text-center text-muted" role="status">Считаем результат…</p></Page>;

  const previous = previousDiagnostic(profile);
  const comparison = previous ? compareDiagnostics(previous, result) : null;
  const accuracy = result.total ? result.correct / result.total : 0;
  const tested = topics.filter((t) => result.byTopic[t.id]);
  const ordered = [...tested].sort((a, b) => (states[a.id]?.mastery ?? 0) - (states[b.id]?.mastery ?? 0));

  return (
    <Page>
      <div className="flex justify-center pt-6">
        <Pill tone="lime">
          <CheckCircle2 size={16} aria-hidden="true" /> Диагностика пройдена
        </Pill>
      </div>

      <div className="mt-6 flex flex-col items-center">
        <p className="text-[15px] text-muted">Прогноз</p>
        <div className="mt-3">
          <GaugeRing
            value={result.predicted / result.max}
            label={`Прогноз: ${result.predicted} из ${result.max} баллов, точность ${percent(accuracy)}`}
          >
            <div>
              <p className="num font-display text-[52px] leading-none font-bold">
                {result.predicted} <span className="text-faint">/</span> {result.max}
              </p>
              <p className="mt-2 text-[15px] text-muted">{percent(accuracy)} точность</p>
            </div>
          </GaugeRing>
        </div>
        <p className="mt-4 text-sm text-muted">
          Верно {result.correct} из {result.total}
        </p>
      </div>

      {comparison && <DiagnosticChanges cmp={comparison} />}

      <Section title="По заданиям">
        <Card className="space-y-1 p-4 sm:p-5">
          {ordered.map((t) => {
            const entry = result.byTopic[t.id];
            return (
              <TopicProgressRow
                key={t.id}
                title={`${t.number}. ${t.short}`}
                value={states[t.id]?.mastery ?? (entry ? entry.correct / entry.total : 0)}
                to={`/topics/${t.id}`}
              />
            );
          })}
        </Card>
      </Section>

      <div className="mt-8 space-y-2">
        <ButtonLink to="/plan" full>
          Открыть мой план
        </ButtonLink>
        <ButtonLink to="/handbook" variant="ghost" full>
          Посмотреть справочник
        </ButtonLink>
        <ButtonLink to="/diagnostic" variant="ghost" full>
          Пройти диагностику ещё раз
        </ButtonLink>
      </div>
    </Page>
  );
}
