import { motion } from 'framer-motion';

interface ProgressBarProps {
  value: number; // 0..1
  label: string; // accessible name
  color?: string;
  height?: 4 | 6 | 8 | 10;
  className?: string;
}

export function ProgressBar({ value, label, color, height = 8, className = '' }: ProgressBarProps) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={pct}
      className={`overflow-hidden rounded-full bg-white/8 ${className}`}
      style={{ height }}
    >
      <motion.div
        className="h-full rounded-full"
        style={{
          background: color ?? 'linear-gradient(90deg, var(--color-violet), var(--color-magenta))',
          boxShadow: `0 0 12px -2px ${color ?? 'var(--color-magenta)'}`,
        }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      />
    </div>
  );
}
