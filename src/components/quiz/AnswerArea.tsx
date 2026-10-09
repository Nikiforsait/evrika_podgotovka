import type { Task } from '../../../content/types.ts';
import { formatValue } from '@/lib/format.ts';
import { sameValue } from '@/lib/rational.ts';
import { AnswerOption, type OptionState } from './AnswerOption.tsx';

const LETTERS = ['A', 'B', 'C', 'D'];

interface AnswerAreaProps {
  task: Task;
  value: string;
  onChange: (value: string) => void;
  revealed: boolean;
  onSubmit: () => void;
}

function placeholder(task: Task): string {
  if (task.answerMode === 'digitset') return 'Например, 13';
  if (task.display === 'digits') return 'Например, 2314';
  if (task.display === 'fraction') return 'Например, 3/4';
  return 'Например, 12 или 0,5';
}

/** Multiple-choice options or a free numeric answer, depending on the task. */
export function AnswerArea({ task, value, onChange, revealed, onSubmit }: AnswerAreaProps) {
  if (task.format === 'choice' && task.options) {
    return (
      <div role="radiogroup" aria-label="Варианты ответа" className="space-y-3">
        {task.options.map((opt, i) => {
          const isAnswer = sameValue(opt.value, task.answer);
          const chosen = value === opt.value;
          let state: OptionState = chosen ? 'selected' : 'idle';
          if (revealed) state = isAnswer ? 'correct' : chosen ? 'wrong' : 'dimmed';
          return (
            <AnswerOption
              key={opt.value}
              letter={LETTERS[i] ?? '?'}
              text={opt.label ?? formatValue(opt.value, task.display, task.unit)}
              prose={!!opt.label}
              state={state}
              disabled={revealed}
              onSelect={() => onChange(opt.value)}
            />
          );
        })}
      </div>
    );
  }

  const isDigits = task.display === 'digits';
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (value.trim()) onSubmit();
      }}
    >
      <label className="block text-[15px] text-muted" htmlFor="answer-input">
        Ваш ответ{task.unit && !isDigits ? ` (${task.unit})` : ''}
      </label>
      <input
        id="answer-input"
        inputMode={isDigits ? 'numeric' : 'decimal'}
        autoComplete="off"
        autoFocus
        disabled={revealed}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder(task)}
        className="num mt-2 w-full rounded-inner bg-surface-high px-5 py-4 font-mono text-2xl font-semibold ring-1 ring-line outline-none placeholder:text-base placeholder:font-normal placeholder:text-faint focus:ring-magenta disabled:opacity-70"
      />
    </form>
  );
}
