import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import type { ReactNode } from 'react';
import { MathText } from '../primitives/MathText.tsx';
import { ProgressBar } from '../primitives/ProgressBar.tsx';

/** "Твой прогресс" pill with a mini bar, used in the task top bar. */
export function ProgressPill({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-2 rounded-full bg-white/8 py-1.5 pr-3 pl-3 text-xs font-semibold">
      <span className="hidden sm:inline">Твой прогресс</span>
      <ProgressBar value={value} label="Твой прогресс по теме" height={4} className="w-12" />
    </span>
  );
}

export function TaskCard({ text }: { text: string }) {
  return (
    <section aria-label="Условие" className="rounded-card bg-surface p-6 shadow-[var(--shadow-glow),var(--shadow-inner-glow)]">
      <p className="text-[19px] leading-relaxed font-bold">
        <MathText text={text} />
      </p>
    </section>
  );
}

/** Centered formula on a soft violet card with an info icon. */
export function FormulaHintCard({ formula, note }: { formula: string; note: string }) {
  return (
    <aside aria-label="Формула" className="rounded-card bg-violet/15 p-5 text-center ring-1 ring-violet/40">
      <p className="flex items-center justify-center gap-2 text-sm text-muted">
        <Info size={16} aria-hidden="true" /> {note}
      </p>
      <p className="mt-2 font-mono text-[17px] font-semibold sm:text-lg">{formula}</p>
    </aside>
  );
}

/** Live feedback line under an input: green check or pink warning. */
export function LiveCheck({ ok, okText, badText }: { ok: boolean | null; okText: string; badText: string }) {
  if (ok === null) return null;
  return (
    <p role="status" className={`mt-2 flex items-center gap-2 px-2 text-sm ${ok ? 'text-lime' : 'text-[#f9a8d4]'}`}>
      {ok ? <CheckCircle2 size={16} aria-hidden="true" /> : <AlertTriangle size={16} aria-hidden="true" />}
      {ok ? okText : badText}
    </p>
  );
}

/** Green confirmation bar that slides up from the bottom of the content. */
export function ConfirmBar({ show, children }: { show: boolean; children: ReactNode }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="status"
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          className="flex min-h-14 items-center gap-3 rounded-inner bg-lime px-5 font-semibold text-[#1a2e05] shadow-glow-lime"
        >
          <CheckCircle2 size={22} aria-hidden="true" />
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
