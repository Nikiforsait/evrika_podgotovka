import type { ReactNode } from 'react';

type Tone = 'lime' | 'violet' | 'pink' | 'yellow' | 'neutral';

const tones: Record<Tone, string> = {
  lime: 'bg-lime/15 text-lime',
  violet: 'bg-violet/20 text-[#d8b4fe]',
  pink: 'bg-pink/15 text-[#f9a8d4]',
  yellow: 'bg-yellow/15 text-yellow',
  neutral: 'bg-white/8 text-muted',
};

interface PillProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
}

export function Pill({ tone = 'neutral', children, className = '' }: PillProps) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-semibold ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}
