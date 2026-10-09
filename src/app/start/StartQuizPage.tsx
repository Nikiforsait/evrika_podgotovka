import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Task } from '../../../content/types.ts';
import { Page } from '@/components/layout/AppShell.tsx';
import { QuizRunner, type QuizResult } from '@/components/quiz/QuizRunner.tsx';
import { loadQuickTasks } from '@/data/content.ts';
import { buildQuickDiagnostic, finishQuickDiagnostic, QUICK_MINUTES } from '@/data/quickDiagnostic.ts';

export default function StartQuizPage() {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [seed] = useState(() => String(Date.now()));
  useEffect(() => {
    let alive = true;
    loadQuickTasks()
      .then((t) => alive && setTasks(t))
      .catch(() => alive && setError('Не удалось загрузить задания. Проверьте соединение и обновите страницу.'));
    return () => {
      alive = false;
    };
  }, []);
  const questions = useMemo(() => (tasks ? buildQuickDiagnostic(tasks, seed) : []), [tasks, seed]);

  const finish = async (results: QuizResult[]) => {
    if (saving) return;
    setSaving(true);
    const answered = new Set(results.map((r) => r.task.id));
    const answers = [
      ...results.map((r) => ({ task: r.task, correct: r.correct })),
      ...questions.filter((q) => !answered.has(q.id)).map((task) => ({ task, correct: false })),
    ];
    await finishQuickDiagnostic(answers);
    navigate('/start/result', { replace: true });
  };

  if (error) return <Page nav={false}><p className="mt-10 text-center" role="alert">{error}</p></Page>;
  if (!tasks) return <Page nav={false}><p className="mt-10 text-center text-muted" role="status">Готовим задачи…</p></Page>;

  return (
    <Page nav={false}>
      <QuizRunner
        tasks={questions}
        total={questions.length}
        mode="diagnostic"
        backTo="/start"
        timerSeconds={QUICK_MINUTES * 60}
        onFinish={(r) => void finish(r)}
      />
    </Page>
  );
}
