import { Lock, PartyPopper } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Task } from '../../../content/types.ts';
import { Page } from '@/components/layout/AppShell.tsx';
import { Button, ButtonLink } from '@/components/primitives/Button.tsx';
import { Card } from '@/components/primitives/Card.tsx';
import { QuizRunner, type QuizResult } from '@/components/quiz/QuizRunner.tsx';
import { nextTask, SESSION_LENGTH, suggestTopic } from '@/data/planner.ts';
import { LEVEL_NAMES } from '@/components/plan/LevelLadder.tsx';
import { topicById } from '@/data/topics.ts';
import { useProfile, useTasks } from '@/hooks/data.ts';
import { canStartLesson, currentPlan, recordLesson } from '@/data/subscription.ts';

/** Adaptive practice: each next task is chosen after the previous answer (P ≈ 0.7). */
export default function PracticePage() {
  const [params] = useSearchParams();
  const levelParam = params.get('level');
  // URL parameters are untrusted: keep only known levels and topic ids.
  const level = levelParam !== null && ['0', '1', '2', '3'].includes(levelParam) ? (Number(levelParam) as 0 | 1 | 2 | 3) : null;
  const total = Math.min(20, Math.max(3, Number(params.get('count')) || SESSION_LENGTH));
  const fromPlan = params.get('from') === 'plan';
  const { tasks, error } = useTasks();
  const profile = useProfile();
  // The limit is checked once, when the profile has loaded; a session already running is never cut off.
  const [allowed, setAllowed] = useState<boolean | null>(null);
  useEffect(() => {
    if (allowed === null && profile.updatedAt) setAllowed(canStartLesson(profile));
  }, [profile, allowed]);
  const [topicId, setTopicId] = useState(() => (topicById(params.get('topic') ?? undefined) ? params.get('topic')! : ''));
  const [queue, setQueue] = useState<Task[]>([]);
  const [results, setResults] = useState<QuizResult[] | null>(null);

  const pool = (all: Task[]) => (level === null ? all : all.filter((t) => t.level === level));

  const [round, setRound] = useState(0);

  useEffect(() => {
    if (!tasks || queue.length) return;
    void (async () => {
      const topic = topicId || (await suggestTopic()).id;
      setTopicId(topic);
      const first = await nextTask(pool(tasks), topic);
      if (first) setQueue([first]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tasks, round]);

  const restart = () => {
    setResults(null);
    setQueue([]);
    setRound((r) => r + 1);
  };

  const onAnswered = async () => {
    if (!tasks || queue.length >= total) return;
    const next = await nextTask(pool(tasks), topicId, queue.map((t) => t.id));
    if (next) setQueue((q) => [...q, next]);
  };

  const title = topicById(topicId)?.title ?? 'Тренировка';
  if (error) return <Page nav={false}><p className="mt-10 text-center" role="alert">{error}</p></Page>;

  if (allowed === null) return <Page nav={false}><p className="mt-10 text-center text-muted" role="status">Готовим тренировку…</p></Page>;

  if (!allowed) {
    const plan = currentPlan(profile);
    return (
      <Page>
        <Card className="mt-10 flex flex-col items-center p-8 text-center" glow="strong">
          <Lock size={40} className="text-yellow" aria-hidden="true" />
          <h1 className="mt-4 font-display text-2xl font-bold">Уроки на этот месяц закончились</h1>
          <p className="mt-2 text-muted">
            Тариф «{plan.name}» включает {plan.lessonsPerMonth} уроков в месяц. Выберите подписку побольше или вернитесь в следующем месяце.
          </p>
        </Card>
        <div className="mt-6 space-y-2">
          <ButtonLink to="/profile" full>Выбрать подписку</ButtonLink>
          <ButtonLink to="/" variant="ghost" full>На главную</ButtonLink>
        </div>
      </Page>
    );
  }

  if (results) {
    const correct = results.filter((r) => r.correct).length;
    return (
      <Page>
        <Card className="mt-10 flex flex-col items-center p-8 text-center" glow="strong">
          <PartyPopper size={40} className="text-yellow" aria-hidden="true" />
          <h1 className="mt-4 font-display text-2xl font-bold">Тренировка завершена</h1>
          <p className="mt-2 text-muted">
            {title}{level !== null ? ` · ${LEVEL_NAMES[level]}` : ''}: верно {correct} из {results.length}
          </p>
          {fromPlan && <p className="mt-1 text-sm text-muted">{correct >= 4 ? 'Отлично — план пересчитан, уровень может вырасти.' : 'План учтёт этот результат и подберёт уровень.'}</p>}
        </Card>
        <div className="mt-6 space-y-2">
          <Button full onClick={restart}>
            Ещё тренировка
          </Button>
          <ButtonLink to={fromPlan ? '/plan' : `/topics/${topicId}`} variant="ghost" full>
            {fromPlan ? 'К плану' : 'К теме'}
          </ButtonLink>
        </div>
      </Page>
    );
  }

  return (
    <Page nav={false}>
      <QuizRunner
        key={round}
        tasks={queue}
        total={total}
        mode="practice"
        allowHint
        backTo={fromPlan ? '/plan' : topicId ? `/topics/${topicId}` : '/'}
        onAnswered={() => void onAnswered()}
        onFinish={(r) => {
          setResults(r);
          void recordLesson();
        }}
      />
    </Page>
  );
}
