import { ChevronRight, type LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';

interface ListRowProps {
  icon: LucideIcon;
  label: string;
  to?: string;
  onClick?: () => void;
  trailing?: ReactNode; // replaces the chevron, e.g. a switch
}

const rowClass =
  'flex min-h-14 w-full items-center gap-4 rounded-inner px-4 text-left text-[15px] transition-colors hover:bg-white/5';

/** Settings-style row: icon, label, chevron (or a custom trailing control). */
export function ListRow({ icon: Icon, label, to, onClick, trailing }: ListRowProps) {
  const content = (
    <>
      <span className="grid size-9 place-items-center rounded-xl bg-violet/15 text-[#d8b4fe]">
        <Icon size={18} aria-hidden="true" />
      </span>
      <span className="flex-1">{label}</span>
      {trailing ?? <ChevronRight size={18} className="text-faint" aria-hidden="true" />}
    </>
  );
  if (to) return <Link to={to} className={rowClass}>{content}</Link>;
  if (onClick) return <button type="button" onClick={onClick} className={rowClass}>{content}</button>;
  return <div className={rowClass}>{content}</div>;
}

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${checked ? 'bg-selected' : 'bg-white/12'}`}
    >
      <span className={`absolute top-1 size-5 rounded-full bg-white transition-[left] ${checked ? 'left-6' : 'left-1'}`} />
    </button>
  );
}
