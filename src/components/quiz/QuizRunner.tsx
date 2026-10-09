import { Lightbulb } from 'lucide-react';
import { useState } from 'react';
import type { Task } from '../../../content/types.ts';
import type { Mode } from '@/data/db.ts';
import { recordAnswer } from '@/data/progress.ts';
import { useProfile } from '@/hooks/data.ts';
import { playCue } from '@/lib/sound.ts';
import { TopBar } from '../layout/TopBar.tsx';
import { Button } from '../primitives/Button.tsx';
import { ProgressBar } from '../primitives/ProgressBar.tsx';
import { AnswerArea } from './AnswerArea.tsx';
import { FeedbackSheet, type Feedback } from './FeedbackSheet.tsx';
import { QuestionCard } from './QuestionCard.tsx';
import { plainText } from '../primitives/MathText.tsx';
import { Timer } from './Timer.tsx';

export interface QuizResult {
  task: Task;
  answer: string;
  correct: boolean;
}

interface QuizRunnerProps {
  tasks: Task[]; // may grow while running (adaptive practice)
  total: number;
  mode: Mode;
  allowHint?: boolean;
  timerSeconds?: number;
  backTo?: string;
  title?: string;
  onAnswered?: (result: QuizResult) => void;
  onFinish: (results: QuizResult[]) => void;
}

export function QuizRunner({ tasks, total, mode, allowHint, timerSeconds, backTo, title, onAnswered, onFinish }: QuizRunnerProps) {
  const profile = useProfile();
  const [index, setIndex] = useState(0);
  const [value, setValue] = useState('');
  const [hintShown, setHintShown] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [results, setResults] = useState<QuizResult[]>([]);
  const [busy, setBusy] = useState(false);
  const task = tasks[index];

  const submit = async (answer: string, skipped = false) => {
    if (!task || busy || feedback) return;
    setBusy(true);
    const outcome = await recordAnswer(task, answer, mode, hintShown);
    const result = { task, answer, correct: outcome.correct };
    setResults((r) => [...r, result]);
    setFeedback({ correct: outcome.correct, skipped, xp: outcome.xp, error: skipped ? null : outcome.error });
    playCue(outcome.correct ? 'correct' : 'wrong', profile.settings.sounds);
    onAnswered?.(result);
    setBusy(false);
  };

  const next = () => {
    if (index + 1 >= total) return onFinish(results);
    setIndex(index + 1);
    setValue('');
    setHintShown(false);
    setFeedback(null);
  };

  const header = (
    <TopBar
      title={title ?? `Вопрос ${Math.min(index + 1, total)} из ${total}`}
      backTo={backTo}
      right={timerSeconds ? <Timer seconds={timerSeconds} onExpire={() => onFinish(results)} /> : undefined}
      below={<ProgressBar value={(index + (feedback ? 1 : 0)) / total} label="Прогресс теста" height={4} className="mb-2" />}
    />
  );

  if (!task) {
    return (
      <>
        {header}
        <p className="mt-10 text-center text-muted" role="status">Подбираем следующее задание…</p>
      </>
    );
  }

  return (
    <>
      {header}
      <div className="mt-4 space-y-5">
        <QuestionCard task={task} />
        {allowHint && hintShown && (
          <p className="flex gap-2 rounded-inner bg-violet/12 p-4 text-[15px] ring-1 ring-violet/40" role="note">
            <Lightbulb size={18} className="mt-0.5 shrink-0 text-yellow" aria-hidden="true" />
            {plainText(task.hint)}
          </p>
        )}
        <AnswerArea task={task} value={value} onChange={setValue} revealed={!!feedback} onSubmit={() => void submit(value)} />
        <FeedbackSheet task={task} feedback={feedback} onContinue={next} continueLabel={index + 1 >= total ? 'Готово' : 'Понятно'} />
        {!feedback && (
          <div className="space-y-2 pt-1">
            <Button full disabled={!value.trim() || busy} onClick={() => void submit(value)}>
              Ответить
            </Button>
            <div className="flex justify-center gap-2">
              {allowHint && !hintShown && (
                <Button variant="ghost" onClick={() => setHintShown(true)}>
                  <Lightbulb size={18} aria-hidden="true" /> Подсказка
                </Button>
              )}
              <Button variant="ghost" onClick={() => void submit('', true)}>
                Пропустить
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
