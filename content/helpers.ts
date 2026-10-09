// Small helpers for writing task templates.
import { formatRational, rat, toCanonical, type Rational } from '../src/lib/rational.ts';
import type { AnswerFormat, ChoiceOption, ErrorKind, Level, TaskDraft, TaskTemplate, WrongPath } from './types.ts';

/** Display a number for problem text: 5000 → "5 000", 2.5 → "2,5". */
export function show(value: number | Rational): string {
  const r = typeof value === 'number' ? fromNumber(value) : value;
  return formatRational(r);
}

/** Fraction text that never turns into a decimal: 4/5, not 0,8. */
export function frac(value: Rational): string {
  return value.d === 1 ? show(value) : `${value.n < 0 ? '−' : ''}${Math.abs(value.n)}/${value.d}`;
}

/** Highlighted fraction for problem text. */
export const hlf = (value: Rational) => `[[${frac(value)}]]`;

/** Highlighted fraction exactly as written, without reducing: hlRaw(2, 8) → "2/8". */
export const hlRaw = (n: number, d: number) => `[[${n}/${d}]]`;

/** Highlighted number for problem text. */
export function hl(value: number | Rational): string {
  return `[[${show(value)}]]`;
}

export function fromNumber(value: number): Rational {
  if (Number.isInteger(value)) return rat(value);
  const scale = 10 ** 6;
  return rat(Math.round(value * scale), scale);
}

export function canon(value: number | Rational): string {
  return toCanonical(typeof value === 'number' ? fromNumber(value) : value);
}

export function wrong(value: number | Rational, error: ErrorKind, note: string): WrongPath {
  return { value: canon(value), error, note };
}

/** SymPy fraction literal. */
export const R = (n: number, d: number) => `Rational(${n}, ${d})`;

const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻' };
const SUB = '₀₁₂₃₄₅₆₇₈₉';

/** Superscript exponent: sup(12) → "¹²". */
export const sup = (n: number) => String(n).split('').map((c) => SUP[c] ?? c).join('');
/** Subscript index: sub(12) → "₁₂". */
export const sub = (n: number) => String(n).split('').map((c) => SUB[Number(c)] ?? c).join('');

/** Power text: pow('a', 5) → "a⁵"; negative exponents get brackets: a⁻³. */
export const pow = (base: string, n: number) => (n === 1 ? base : `${base}${sup(n)}`);

/** Linear term with sign for equation text: term(-1, 'x') → "− x", term(3) → "+ 3". */
export function term(coef: number, variable = ''): string {
  if (coef === 0) return '';
  const abs = Math.abs(coef);
  const body = variable && abs === 1 ? variable : `${abs}${variable}`;
  return `${coef < 0 ? '−' : '+'} ${body}`;
}

/** Leading term without a "+" sign: lead(-3, 'x') → "−3x", lead(1, 'x') → "x". */
export function lead(coef: number, variable = ''): string {
  const abs = Math.abs(coef);
  const body = variable && abs === 1 ? variable : `${abs}${variable}`;
  return coef < 0 ? `−${body}` : body;
}

/** Compact template constructor. */
export const T = (
  id: string,
  topicId: string,
  level: Level,
  format: AnswerFormat,
  generate: (rng: () => number) => TaskDraft,
): TaskTemplate => ({ id, topicId, level, format, generate });

/**
 * Labelled options: the answer is the 1-based index of the correct label.
 * Returns the fields to spread into a draft.
 */
export function labelled(labels: string[], correct: number): Pick<TaskDraft, 'options' | 'answer' | 'expr'> {
  if (correct < 1 || correct > labels.length) throw new Error('labelled(): correct index out of range');
  return {
    options: labels.map((label, i) => ({ value: String(i + 1), label })),
    answer: String(correct),
    expr: String(correct),
  };
}

/** Yes/no question: answer "1" = да, "2" = нет. */
export const yesNo = (yes: boolean) => labelled(['Да', 'Нет'], yes ? 1 : 2);

/** Digit-sequence answer (matching tasks): display as digits, no thousands grouping. */
export function digits(sequence: string): Pick<TaskDraft, 'answer' | 'expr' | 'display'> {
  return { answer: sequence, expr: sequence, display: 'digits' };
}

/** Integer part and remainder of n/d, for "выделите целую часть" explanations. */
export const mixed = (n: number, d: number) => ({ whole: Math.floor(n / d), rest: n - Math.floor(n / d) * d });

export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : Math.abs(a));
export const lcm = (a: number, b: number) => (a * b) / gcd(a, b);

export type Opt = ChoiceOption;
