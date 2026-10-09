import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type Variant = 'cta' | 'ghost' | 'pill' | 'soft';

const base =
  'inline-flex items-center justify-center gap-2 font-semibold transition-[transform,box-shadow,background-color,opacity] duration-150 active:scale-[0.98] disabled:opacity-45 disabled:active:scale-100 select-none';

const variants: Record<Variant, string> = {
  cta: 'bg-cta text-white rounded-full min-h-14 px-7 text-[17px] shadow-[0_10px_30px_-10px_rgb(236_72_153/0.8)] hover:shadow-[0_14px_36px_-10px_rgb(236_72_153/0.95)]',
  ghost: 'text-muted hover:text-ink rounded-full min-h-12 px-5 text-[15px] hover:bg-white/5',
  pill: 'bg-cta text-white rounded-full min-h-9 px-4 text-sm',
  soft: 'bg-surface-high text-ink rounded-full min-h-11 px-5 text-[15px] shadow-glow hover:bg-[#3c2366]',
};

export function buttonClass(variant: Variant = 'cta', full = false, extra = ''): string {
  return `${base} ${variants[variant]} ${full ? 'w-full' : ''} ${extra}`;
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
  children: ReactNode;
}

export function Button({ variant = 'cta', full, className = '', type = 'button', ...rest }: ButtonProps) {
  return <button type={type} className={buttonClass(variant, full, className)} {...rest} />;
}

interface ButtonLinkProps extends LinkProps {
  variant?: Variant;
  full?: boolean;
}

export function ButtonLink({ variant = 'cta', full, className = '', ...rest }: ButtonLinkProps) {
  return <Link className={buttonClass(variant, full, className)} {...rest} />;
}
