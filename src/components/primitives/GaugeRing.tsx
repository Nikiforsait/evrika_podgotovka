import { motion } from 'framer-motion';
import { useId, type ReactNode } from 'react';
import { gradient } from '@/design-system/tokens.ts';

interface GaugeRingProps {
  value: number; // 0..1
  size?: number;
  stroke?: number;
  label: string; // accessible description
  children?: ReactNode; // centered content
}

/** Circular gauge with a violet → pink → lime gradient arc and a soft glow. */
export function GaugeRing({ value, size = 240, stroke = 16, label, children }: GaugeRingProps) {
  const id = useId();
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, value));
  const [from, mid, to] = gradient.gauge;

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }} role="img" aria-label={label}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={from} />
            <stop offset="0.55" stopColor={mid} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
          <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgb(255 255 255 / 0.07)" strokeWidth={stroke} />
        {[`url(#${id}-glow)`, undefined].map((filter, i) => (
          <motion.circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={`url(#${id}-g)`}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={c}
            filter={filter}
            opacity={filter ? 0.7 : 1}
            initial={{ strokeDashoffset: c }}
            animate={{ strokeDashoffset: c * (1 - clamped) }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{children}</div>
    </div>
  );
}
