import { ChevronRight, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface TrainerCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  to: string;
  color?: string;
}

/** Grid card linking to a trainer: icon, title, one line of description, chevron. */
export function TrainerCard({ icon: Icon, title, description, to, color = '#A855F7' }: TrainerCardProps) {
  return (
    <Link
      to={to}
      className="group flex h-full flex-col gap-3 rounded-inner bg-surface p-4 shadow-glow transition-shadow hover:shadow-glow-strong"
    >
      <span className="flex items-start justify-between">
        <span className="grid size-10 place-items-center rounded-xl" style={{ background: `${color}24`, color }}>
          <Icon size={20} aria-hidden="true" />
        </span>
        <ChevronRight size={18} className="text-faint transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
      <span className="text-[15px] leading-snug font-semibold">{title}</span>
      <span className="text-[13px] leading-snug text-muted">{description}</span>
    </Link>
  );
}
