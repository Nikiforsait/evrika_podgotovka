import { BookOpen, Home, Route as RouteIcon, Trophy, User, type LucideIcon } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const ITEMS: { to: string; label: string; icon: LucideIcon; end?: boolean }[] = [
  { to: '/', label: 'Главная', icon: Home, end: true },
  { to: '/plan', label: 'План', icon: RouteIcon },
  { to: '/topics', label: 'Темы', icon: BookOpen },
  { to: '/duels', label: 'Дуэли', icon: Trophy },
  { to: '/profile', label: 'Профиль', icon: User },
];

/** Bottom bar on phones, left rail on wide screens. */
export function BottomNav() {
  return (
    <nav
      aria-label="Основная навигация"
      className="no-print fixed inset-x-0 bottom-0 z-30 border-t border-line bg-[#150926]/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:inset-y-0 lg:right-auto lg:w-60 lg:border-t-0 lg:border-r lg:pb-0"
    >
      <div className="hidden px-6 pt-8 pb-10 lg:block">
        <span className="font-display text-2xl font-bold tracking-tight">Эврика</span>
        <p className="mt-1 text-[13px] text-muted">твой личный тренер по ОГЭ</p>
      </div>
      <ul className="mx-auto flex max-w-md justify-around lg:mx-0 lg:max-w-none lg:flex-col lg:gap-1 lg:px-3">
        {ITEMS.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-h-16 min-w-14 flex-col items-center justify-center gap-1 rounded-2xl px-3 text-xs font-medium transition-colors lg:min-h-12 lg:flex-row lg:justify-start lg:gap-3 lg:px-4 lg:text-[15px] ${
                  isActive ? 'text-ink lg:bg-violet/15' : 'text-faint hover:text-muted'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`grid size-9 place-items-center rounded-full transition-shadow ${
                      isActive ? 'bg-selected shadow-glow-strong' : ''
                    }`}
                  >
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
