import { motion } from 'framer-motion';
import { useMemo } from 'react';

const COLORS = ['#E879F9', '#A3E635', '#FACC15', '#22D3EE', '#FB923C', '#F5F0FF'];

/** Decorative falling confetti over the parent (which must be `relative`). Hidden from assistive tech. */
export function Confetti({ count = 70 }: { count?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 3 + Math.random() * 2.5,
        size: 6 + Math.random() * 7,
        color: COLORS[i % COLORS.length]!,
        spin: 360 + Math.random() * 720,
        drift: (Math.random() - 0.5) * 60,
        round: Math.random() < 0.3,
      })),
    [count],
  );
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <motion.span
          key={p.id}
          className={`absolute top-0 block ${p.round ? 'rounded-full' : 'rounded-sm'}`}
          style={{ left: `${p.x}%`, width: p.size, height: p.round ? p.size : p.size * 0.6, background: p.color }}
          initial={{ y: -30, opacity: 0, rotate: 0, x: 0 }}
          animate={{ y: '110vh', opacity: [0, 1, 1, 0.9, 0.6], rotate: p.spin, x: [0, p.drift, -p.drift, p.drift / 2] }}
          transition={{ delay: p.delay, duration: p.duration, ease: 'linear', repeat: Infinity, repeatDelay: 0.3 }}
        />
      ))}
    </div>
  );
}
