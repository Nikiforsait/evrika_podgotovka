import { Clock } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatTimer } from '@/lib/format.ts';

interface TimerProps {
  seconds: number;
  onExpire: () => void;
  paused?: boolean;
}

/** Countdown shown in the quiz top bar. Announces only the last minute. */
export function Timer({ seconds, onExpire, paused = false }: TimerProps) {
  const [left, setLeft] = useState(seconds);
  const expired = useRef(false);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [paused]);

  useEffect(() => {
    if (left === 0 && !expired.current) {
      expired.current = true;
      onExpireRef.current();
    }
  }, [left]);

  const low = left <= 60;
  return (
    <span
      className={`num flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-sm font-semibold ${
        low ? 'bg-pink/20 text-[#f9a8d4]' : 'bg-white/8 text-ink'
      }`}
      aria-label={`Осталось ${formatTimer(left)}`}
      aria-live={low ? 'polite' : 'off'}
    >
      <Clock size={15} aria-hidden="true" />
      {formatTimer(left)}
    </span>
  );
}
