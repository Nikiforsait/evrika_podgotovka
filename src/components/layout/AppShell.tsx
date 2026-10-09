import type { ReactNode } from 'react';
import { BottomNav } from './BottomNav.tsx';
import { BrandStrip } from './BrandStrip.tsx';

interface PageProps {
  children: ReactNode;
  nav?: boolean; // show bottom nav / side rail
  wide?: boolean; // allow a wider content column on desktop
  accent?: boolean; // thin lime strip at the very top
  brand?: boolean; // the «Эврика — твой личный тренер по ОГЭ» line; hidden on solving screens
}

/** Page frame: centered column, bottom nav on phones, side rail on desktop. */
export function Page({ children, nav = true, wide = false, accent = false, brand = nav }: PageProps) {
  return (
    <>
      <a
        href="#main"
        className="sr-only z-50 rounded-full bg-cta px-4 py-2 font-semibold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        К содержанию
      </a>
      {accent && <div className="h-1.5 w-full bg-lime shadow-[0_0_24px_rgb(163_230_53/0.6)]" aria-hidden="true" />}
      <div className={nav ? 'lg:pl-60' : ''}>
        {brand && <BrandStrip />}
        <main
          id="main"
          className={`mx-auto w-full px-4 sm:px-6 ${wide ? 'max-w-5xl' : 'max-w-2xl'} ${nav ? 'pb-32 lg:pb-16' : 'pb-12'}`}
        >
          {children}
        </main>
      </div>
      {nav && <BottomNav />}
    </>
  );
}

/** Full-bleed immersive layout without chrome (diagnostic start). */
export function Immersive({ children }: { children: ReactNode }) {
  return (
    <main
      id="main"
      className="relative grid min-h-dvh place-items-center overflow-hidden px-6 py-16"
      style={{ background: 'radial-gradient(120% 80% at 50% 30%, #3a1766 0%, #1a0b2e 45%, #07030d 100%)' }}
    >
      <div className="absolute inset-x-0 top-0">
        <BrandStrip />
      </div>
      {children}
    </main>
  );
}
