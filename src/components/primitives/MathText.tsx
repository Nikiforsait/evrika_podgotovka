import { Fragment } from 'react';

interface MathTextProps {
  text: string;
  className?: string;
}

/** Renders task text; numbers wrapped in [[...]] are highlighted in the accent color. */
export function MathText({ text, className = '' }: MathTextProps) {
  const parts = text.split(/(\[\[[^\]]+\]\])/g);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        part.startsWith('[[') ? (
          <span key={i} className="num font-bold whitespace-nowrap text-[#e879f9]">
            {part.slice(2, -2)}
          </span>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        ),
      )}
    </span>
  );
}

/** Plain text version for aria-labels, notes and printing. */
export const plainText = (text: string) => text.replace(/\[\[|\]\]/g, '');
