import { Check, X } from 'lucide-react';

export type OptionState = 'idle' | 'selected' | 'correct' | 'wrong' | 'dimmed';

interface AnswerOptionProps {
  letter: string;
  text: string;
  /** Prose option (an interval, a statement) rather than a number: proportional font, wraps. */
  prose?: boolean;
  state: OptionState;
  disabled?: boolean;
  onSelect: () => void;
}

const styles: Record<OptionState, string> = {
  idle: 'bg-surface ring-1 ring-line hover:ring-violet/70',
  selected: 'bg-selected text-white shadow-glow-strong',
  correct: 'bg-lime/15 ring-2 ring-lime shadow-glow-lime',
  wrong: 'bg-pink/12 ring-2 ring-pink/80',
  dimmed: 'bg-surface/60 ring-1 ring-line opacity-60',
};

const badge: Record<OptionState, string> = {
  idle: 'bg-violet/20 text-[#d8b4fe]',
  selected: 'bg-white/25 text-white',
  correct: 'bg-lime text-[#1a2e05]',
  wrong: 'bg-pink text-white',
  dimmed: 'bg-white/8 text-faint',
};

/** One multiple-choice answer: letter badge, value, state icon after checking. */
export function AnswerOption({ letter, text, prose, state, disabled, onSelect }: AnswerOptionProps) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={state === 'selected' || state === 'correct' || state === 'wrong'}
      disabled={disabled}
      onClick={onSelect}
      className={`flex min-h-16 w-full items-center gap-4 rounded-inner px-4 text-left transition-[box-shadow,background-color] duration-200 disabled:cursor-default ${styles[state]}`}
    >
      <span className={`grid size-9 shrink-0 place-items-center rounded-xl font-display text-sm font-bold ${badge[state]}`}>
        {letter}
      </span>
      <span className={prose ? 'flex-1 py-3 text-[15px] leading-snug font-medium' : 'num flex-1 font-mono text-lg font-semibold'}>{text}</span>
      {state === 'correct' && <Check size={20} className="text-lime" aria-label="Верный ответ" />}
      {state === 'wrong' && <X size={20} className="text-[#f9a8d4]" aria-label="Неверный ответ" />}
    </button>
  );
}
