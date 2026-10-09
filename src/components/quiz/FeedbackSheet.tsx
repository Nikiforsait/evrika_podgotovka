import { motion } from 'framer-motion';
import { CheckCircle2, Lightbulb, XCircle } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { plainText } from '../primitives/MathText.tsx';
import type { Task } from '../../../content/types.ts';
import type { ErrorAnalysis } from '@/lib/errors.ts';
import { formatValue } from '@/lib/format.ts';

export interface Feedback {
  correct: boolean;
  skipped?: boolean;
  xp?: number;
  error: ErrorAnalysis | null;
}

interface FeedbackSheetProps {
  task: Task;
  feedback: Feedback | null;
  onContinue: () => void;
  continueLabel?: string;
}

/** Slides in after an answer: verdict, likely mistake, step-by-step solution. */
export function FeedbackSheet({ task, feedback, onContinue, continueLabel = 'Понятно' }: FeedbackSheetProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (feedback) buttonRef.current?.focus();
  }, [feedback]);

  return (
    feedback && (
        <motion.section
          key={task.id}
          role="status"
          aria-live="polite"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          className={`rounded-card p-5 sm:p-6 ${
            feedback.correct ? 'bg-[#1f2e12] shadow-glow-lime' : 'bg-[#33122b] shadow-[0_0_0_1px_rgb(236_72_153/0.5)]'
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              {feedback.correct ? (
                <CheckCircle2 className="text-lime" size={26} aria-hidden="true" />
              ) : (
                <XCircle className="text-[#f9a8d4]" size={26} aria-hidden="true" />
              )}
              <h2 className="font-display text-xl font-bold">
                {feedback.correct ? 'Верно!' : feedback.skipped ? 'Пропущено' : 'Не совсем'}
              </h2>
              {!!feedback.xp && <span className="text-sm font-semibold text-lime">+{feedback.xp} XP</span>}
            </div>
            <button
              ref={buttonRef}
              type="button"
              onClick={onContinue}
              className="min-h-10 shrink-0 rounded-full bg-white/12 px-4 text-sm font-semibold hover:bg-white/20"
            >
              {continueLabel}
            </button>
          </div>

          {!feedback.correct && (
            <p className="mt-3 text-[15px]">
              Правильный ответ:{' '}
              <strong className="num font-mono">
                {task.options?.find((o) => o.value === task.answer)?.label ?? formatValue(task.answer, task.display, task.unit)}
              </strong>
            </p>
          )}
          {feedback.error && (
            <p className="mt-2 flex gap-2 text-[15px] text-[#fbcfe8]">
              <Lightbulb size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
              <span>
                <strong>{feedback.error.label}.</strong> {feedback.error.note}
              </span>
            </p>
          )}

          <ol className="mt-4 space-y-1.5 border-t border-white/10 pt-4 font-mono text-[14px] leading-relaxed text-ink/90">
            {task.steps.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className="text-faint" aria-hidden="true">
                  {i + 1}.
                </span>
                <span>{plainText(step)}</span>
              </li>
            ))}
          </ol>
        </motion.section>
    )
  );
}
