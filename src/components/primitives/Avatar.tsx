interface AvatarProps {
  name: string;
  hue?: number;
  size?: 32 | 40 | 48 | 56 | 72;
  className?: string;
}

/** Initial-letter avatar on a hue-tinted gradient (no photos are stored). */
export function Avatar({ name, hue = 290, size = 40, className = '' }: AvatarProps) {
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  return (
    <span
      aria-hidden="true"
      className={`inline-grid shrink-0 place-items-center rounded-full font-display font-semibold text-white ${className}`}
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `linear-gradient(135deg, hsl(${hue} 85% 62%), hsl(${(hue + 40) % 360} 80% 45%))`,
        boxShadow: `0 0 0 2px rgb(26 11 46), 0 0 18px -4px hsl(${hue} 90% 60% / 0.7)`,
      }}
    >
      {initial}
    </span>
  );
}
