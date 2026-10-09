// Exact rational numbers for answer checking and display.
// Answers are stored canonically as "n" or "n/d" (d > 1, reduced).

export interface Rational {
  n: number;
  d: number;
}

export function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

export function rat(n: number, d = 1): Rational {
  if (d === 0) throw new Error('Division by zero');
  const sign = d < 0 ? -1 : 1;
  const g = gcd(n, d);
  return { n: (sign * n) / g, d: Math.abs(d) / g };
}

export const add = (a: Rational, b: Rational) => rat(a.n * b.d + b.n * a.d, a.d * b.d);
export const sub = (a: Rational, b: Rational) => rat(a.n * b.d - b.n * a.d, a.d * b.d);
export const mul = (a: Rational, b: Rational) => rat(a.n * b.n, a.d * b.d);
export const div = (a: Rational, b: Rational) => rat(a.n * b.d, a.d * b.n);
export const eq = (a: Rational, b: Rational) => a.n === b.n && a.d === b.d;
export const toNumber = (r: Rational) => r.n / r.d;

/** Canonical storage form: "7", "-3/4". */
export function toCanonical(r: Rational): string {
  return r.d === 1 ? String(r.n) : `${r.n}/${r.d}`;
}

/** True when the decimal expansion terminates (denominator has only 2s and 5s). */
export function isTerminating(r: Rational): boolean {
  let d = r.d;
  while (d % 2 === 0) d /= 2;
  while (d % 5 === 0) d /= 5;
  return d === 1;
}

/** Group thousands with a thin no-break space, Russian style: 5 000. */
export function groupThousands(intPart: string): string {
  const neg = intPart.startsWith('-');
  const digits = neg ? intPart.slice(1) : intPart;
  if (digits.length < 4) return intPart;
  const grouped = digits.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return neg ? `−${grouped}` : grouped;
}

/** Human display: integers grouped, terminating fractions as decimals with a comma. */
export function formatRational(r: Rational): string {
  if (r.d === 1) return groupThousands(String(r.n)).replace('-', '−');
  if (isTerminating(r)) {
    const text = String(Number((r.n / r.d).toFixed(6)));
    const [i = '0', f] = text.split('.');
    return `${groupThousands(i).replace('-', '−')},${f}`;
  }
  return `${r.n < 0 ? '−' : ''}${Math.abs(r.n)}/${r.d}`;
}

/** Parse canonical strings and user input: "4 000", "2,5", "-3/4", "−1". */
export function parseRational(raw: string): Rational | null {
  const s = raw
    .trim()
    .replace(/[\s  ]/g, '')
    .replace(/[−–]/g, '-')
    .replace(',', '.');
  if (!s) return null;
  const frac = /^(-?\d+)\/(-?\d+)$/.exec(s);
  if (frac) {
    const d = Number(frac[2]);
    return d === 0 ? null : rat(Number(frac[1]), d);
  }
  const dec = /^(-?)(\d*)\.?(\d*)$/.exec(s);
  if (!dec || (!dec[2] && !dec[3])) return null;
  const [, sign, whole = '', fracPart = ''] = dec;
  const d = 10 ** fracPart.length;
  const n = Number(`${whole || '0'}${fracPart}`);
  return rat(sign === '-' ? -n : n, d);
}

export function sameValue(input: string, canonical: string): boolean {
  const a = parseRational(input);
  const b = parseRational(canonical);
  return !!a && !!b && eq(a, b);
}
