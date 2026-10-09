import { useLiveQuery } from 'dexie-react-hooks';
import { useMemo, useState } from 'react';
import type { Task } from '../../../content/types.ts';
import { useParams } from 'react-router-dom';
import { Page } from '@/components/layout/AppShell.tsx';
import { DuelCard } from '@/components/game/DuelCard.tsx';
import { ButtonLink } from '@/components/primitives/Button.tsx';
import { QuizRunner } from '@/components/quiz/QuizRunner.tsx';
import { classmateById } from '@/data/classmates.ts';
import { db } from '@/data/db.ts';
import { DUEL_XP, playDuelTask, visibleScore } from '@/data/duels.ts';
import { useProfile, useTasks } from '@/hooks/data.ts';

export default function DuelPlayPage() {
  const { duelId = '' } = useParams();
  const profile = useProfile();
  const { tasks } = useTasks();
  const duel = useLiveQuery(() => db.duels.get(duelId).then((d) => d ?? null), [duelId]);
  const [finished, setFinished] = useState(false);

  // Freeze the remaining task list once loaded (keyed by duel id, not progress),
  // so recording an answer doesn't shift the list under the runner.
  const duelKey = duel?.id;
  const remaining = useMemo(() => {
    if (!duel || !tasks) return [];
    return duel.taskIds
      .slice(duel.mine.length)
      .map((id) => tasks.find((t) => t.id === id))
      .filter((t): t is Task => !!t);
  }, [duelKey, tasks]); // eslint-disable-line react-hooks/exhaustive-deps

  if (duel === undefined || !tasks) return <Page><p className="mt-10 text-center text-muted" role="status">Загружаем дуэль…</p></Page>;
  if (duel === null) return <Page><p className="mt-10 text-center">Дуэль не найдена.</p></Page>;

  const mate = classmateById(duel.opponentId);
  // Keep the runner on screen until the last feedback is dismissed.
  const done = finished || remaining.length === 0;

  if (done) {
    const xp = duel.status in DUEL_XP ? DUEL_XP[duel.status as keyof typeof DUEL_XP] : 0;
    return (
      <Page>
        <h1 className="mt-8 text-center font-display text-2xl font-bold">
          {duel.status === 'won' ? 'Победа!' : duel.status === 'lost' ? 'В этот раз победа за соперником' : 'Ничья'}
        </h1>
        <p className="mt-2 text-center text-muted">+{xp} XP за дуэль</p>
        <div className="mt-6">
          <DuelCard duel={duel} myName={profile.name} />
        </div>
        <ButtonLink to="/duels" full className="mt-6">
          К дуэлям
        </ButtonLink>
      </Page>
    );
  }

  const score = visibleScore(duel);
  const offset = duel.taskIds.length - remaining.length;
  return (
    <Page nav={false}>
      <QuizRunner
        tasks={remaining}
        total={remaining.length}
        mode="duel"
        backTo="/duels"
        title={`Дуэль с ${mate?.name ?? 'соперником'} · ${score.mine} : ${score.theirs}`}
        onAnswered={(r) => void playDuelTask(duel.id, r.correct)}
        onFinish={() => setFinished(true)}
      />
      <p className="mt-4 text-center text-sm text-faint">
        Всего заданий: {duel.taskIds.length}. Уже решено: {offset}.
      </p>
    </Page>
  );
}
