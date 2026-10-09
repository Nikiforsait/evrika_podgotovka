import type { LucideIcon } from 'lucide-react';

interface StatTileProps {
  icon: LucideIcon;
  label: string;
  value: string;
  color: string;
}

/** Small stat card: colored icon, big value, label. */
export function StatTile({ icon: Icon, label, value, color }: StatTileProps) {
  return (
    <div className="flex flex-col gap-2 rounded-inner bg-surface p-4 shadow-glow">
      <span className="grid size-9 place-items-center rounded-xl" style={{ background: `${color}22`, color }}>
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="num font-display text-xl font-bold">{value}</span>
      <span className="text-[13px] text-muted">{label}</span>
    </div>
  );
}
