import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Page } from '@/components/layout/AppShell.tsx';
import { TopBar } from '@/components/layout/TopBar.tsx';
import { ProgressPill } from '@/components/task/TaskParts.tsx';
import { makeGuided } from '@/data/guided.ts';
import { useTopicStates } from '@/hooks/data.ts';
import { GuidedAdvanced } from './GuidedAdvanced.tsx';
import { GuidedIntermediate } from './GuidedIntermediate.tsx';

/**
 * Guided discount problem in two steps:
 *   step 1 — "Разбор задачи": extract the givens, then compute;
 *   step 2 — "Скидываем цену": apply the formula with live feedback.
 */
export default function GuidedTaskPage() {
  const [params, setParams] = useSearchParams();
  const [fallbackSeed] = useState(() => String(Date.now()));
  const seed = params.get('seed') ?? fallbackSeed;
  const step = params.get('step') === '2' ? 2 : 1;
  const problem = makeGuided(seed);
  const mastery = useTopicStates().t6?.mastery ?? 0;

  const go = (next: { step?: 1 | 2; fresh?: boolean }) => {
    const nextSeed = next.fresh ? String(Date.now()) : seed;
    setParams({ seed: nextSeed, step: String(next.step ?? 1) });
  };

  return (
    <Page nav={false}>
      <TopBar
        title={step === 1 ? 'Разбор задачи' : 'Скидываем цену'}
        backTo="/topics/t6"
        right={<ProgressPill value={mastery} />}
      />
      <p className="mt-1 mb-4 text-center text-sm text-muted">Шаг {step} из 2</p>
      {step === 1 ? (
        <GuidedIntermediate key={`${seed}-1`} problem={problem} onNext={() => go({ step: 2 })} />
      ) : (
        <GuidedAdvanced key={`${seed}-2`} problem={problem} onNext={() => go({ step: 1, fresh: true })} />
      )}
    </Page>
  );
}
