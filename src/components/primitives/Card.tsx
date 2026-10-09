import type { HTMLAttributes, ReactNode } from 'react';

interface CardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  glow?: 'default' | 'strong' | 'lime' | 'none';
  as?: 'div' | 'section' | 'article';
}

const glows = {
  default: 'shadow-glow',
  strong: 'shadow-glow-strong',
  lime: 'shadow-glow-lime',
  none: '',
};

export function Card({ children, glow = 'default', as: Tag = 'div', className = '', ...rest }: CardProps) {
  return (
    <Tag className={`bg-surface rounded-card ${glows[glow]} ${className}`} {...rest}>
      {children}
    </Tag>
  );
}

interface SectionProps {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Titled page section; the title is a real heading for screen-reader navigation. */
export function Section({ title, action, children, className = '' }: SectionProps) {
  return (
    <section className={`mt-8 ${className}`} aria-label={title}>
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="font-display text-[17px] font-semibold tracking-tight">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
