import { formatRational, parseRational } from './rational.ts';

/** Display a canonical answer value; fraction tasks keep "n/d" form, digit answers stay as typed. */
export function formatValue(canonical: string, display?: 'fraction' | 'digits', unit?: string): string {
  if (display === 'digits') return canonical;
  const r = parseRational(canonical);
  if (!r) return canonical;
  const text =
    display === 'fraction' && r.d !== 1 ? `${r.n < 0 ? '−' : ''}${Math.abs(r.n)}/${r.d}` : formatRational(r);
  return unit ? `${text} ${unit}` : text;
}

/** Russian plural: plural(5, ['день', 'дня', 'дней']) → "дней". */
export function plural(n: number, forms: [string, string, string]): string {
  const mod10 = Math.abs(n) % 10;
  const mod100 = Math.abs(n) % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

export const percent = (x: number) => `${Math.round(x * 100)}%`;

export function formatTimer(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
}
