import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '@/components/layout/AppShell.tsx';
import { QuizRunner, type QuizResult } from '@/components/quiz/QuizRunner.tsx';
import { buildDiagnostic, finishDiagnostic } from '@/data/diagnostic.ts';
import { useTasks } from '@/hooks/data.ts';

export default function DiagnosticQuizPage() {
  const navigate = useNavigate();
  const { tasks, error } = useTasks();
  const [saving, setSaving] = useState(false);
  const [seed] = useState(() => String(Date.now()));
  const questions = useMemo(() => (tasks ? buildDiagnostic(tasks, seed) : []), [tasks, seed]);

  const finish = async (results: QuizResult[]) => {
    if (saving) return;
    setSaving(true);
    // Questions left unanswered count as incorrect.
    const answered = new Set(results.map((r) => r.task.id));
    const answers = [
      ...results.map((r) => ({ taskId: r.task.id, topicId: r.task.topicId, correct: r.correct })),
      ...questions.filter((q) => !answered.has(q.id)).map((q) => ({ taskId: q.id, topicId: q.topicId, correct: false })),
    ];
    await finishDiagnostic(answers);
    navigate('/diagnostic/result', { replace: true });
  };

  if (error) return <Page nav={false}><p className="mt-10 text-center" role="alert">{error}</p></Page>;
  if (!tasks) return <Page nav={false}><p className="mt-10 text-center text-muted" role="status">Готовим вопросы…</p></Page>;

  return (
    <Page nav={false}>
      <QuizRunner
        tasks={questions}
        total={questions.length}
        mode="diagnostic"
        backTo="/diagnostic"
        onFinish={(r) => void finish(r)}
      />
    </Page>
  );
}
