import { ArrowLeft } from 'lucide-react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

interface TopBarProps {
  title: string;
  backTo?: string; // explicit target; otherwise browser back
  right?: ReactNode;
  below?: ReactNode; // e.g. a progress bar under the bar
}

export function TopBar({ title, backTo, right, below }: TopBarProps) {
  const navigate = useNavigate();
  const goBack = () => (backTo ? navigate(backTo) : window.history.length > 1 ? navigate(-1) : navigate('/'));
  return (
    <header className="no-print sticky top-0 z-20 -mx-4 bg-[#1d0d33]/80 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl sm:-mx-6 sm:px-6">
      <div className="grid min-h-16 grid-cols-[48px_1fr_auto] items-center gap-2">
        <button
          type="button"
          onClick={goBack}
          aria-label="Назад"
          className="grid size-11 place-items-center rounded-full text-ink hover:bg-white/8"
        >
          <ArrowLeft size={22} aria-hidden="true" />
        </button>
        <h1 className="truncate text-center font-display text-[17px] font-semibold">{title}</h1>
        <div className="flex min-w-12 justify-end">{right}</div>
      </div>
      {below}
    </header>
  );
}

export function IconButton({ label, onClick, children }: { label: string; onClick?: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="grid size-11 place-items-center rounded-full text-muted hover:bg-white/8 hover:text-ink"
    >
      {children}
    </button>
  );
}
