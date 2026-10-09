// Rule-based error analysis: classifies a wrong answer by the likely mistake,
// and builds multiple-choice distractors from the same rules.
import type { ChoiceOption, ErrorKind, WrongPath } from '../../content/types.ts';
import { eq, mul, parseRational, rat, sub, toCanonical, toNumber, type Rational } from './rational.ts';
import { shuffle, type Rng } from './rng.ts';

export const ERROR_LABELS: Record<ErrorKind, string> = {
  sign: 'Ошибка в знаке',
  decimal: 'Сдвиг запятой',
  rounding: 'Округление или граница',
  digitSwap: 'Переставлены цифры',
  wrongFormula: 'Не та формула',
};

export const ERROR_TIPS: Record<ErrorKind, string> = {
  sign: 'Проверяйте знак при переносе слагаемых и при умножении на отрицательное число.',
  decimal: 'Сверьте порядок величины: деление на 100 и перенос запятой — частые ловушки.',
  rounding: 'Не округляйте раньше времени и следите, входит ли граница в ответ.',
  digitSwap: 'Перепроверьте, как вы переписали число из условия.',
  wrongFormula: 'Сверьтесь с формулой в справочнике перед вычислением.',
};

export interface ErrorAnalysis {
  kind: ErrorKind;
  label: string;
  note: string;
}

interface Checkable {
  answer: string;
  wrong: WrongPath[];
}

const POWERS = [10, 100, 1000];

function isDecimalShift(v: Rational, a: Rational): boolean {
  return POWERS.some((p) => eq(v, mul(a, rat(p))) || eq(v, mul(a, rat(1, p))));
}

function isDigitSwap(v: Rational, a: Rational): boolean {
  if (v.d !== 1 || a.d !== 1 || v.n === a.n) return false;
  const digits = (n: number) => String(Math.abs(n)).split('').sort().join('');
  return Math.sign(v.n) === Math.sign(a.n) && digits(v.n) === digits(a.n);
}

function isRounding(v: Rational, a: Rational): boolean {
  const diff = Math.abs(toNumber(sub(v, a)));
  if (a.d === 1 && v.d === 1) return diff === 1;
  return diff < 1 && Math.round(toNumber(a)) === Math.round(toNumber(v));
}

/** Classify a wrong answer. Returns null for correct or unrecognised answers. */
export function analyzeError(input: string, task: Checkable): ErrorAnalysis | null {
  const v = parseRational(input);
  const a = parseRational(task.answer);
  if (!v || !a || eq(v, a)) return null;

  const known = task.wrong.find((w) => {
    const wv = parseRational(w.value);
    return wv && eq(wv, v);
  });
  if (known) return { kind: known.error, label: ERROR_LABELS[known.error], note: known.note };

  const rules: [ErrorKind, boolean][] = [
    ['sign', eq(v, rat(-a.n, a.d)) && a.n !== 0],
    ['decimal', isDecimalShift(v, a)],
    ['digitSwap', isDigitSwap(v, a)],
    ['rounding', isRounding(v, a)],
  ];
  const hit = rules.find(([, ok]) => ok);
  if (!hit) return null;
  return { kind: hit[0], label: ERROR_LABELS[hit[0]], note: ERROR_TIPS[hit[0]] };
}

function swapAdjacentDigits(n: number): number | null {
  const s = String(Math.abs(n));
  for (let i = 0; i < s.length - 1; i++) {
    if (s[i] !== s[i + 1]) {
      const swapped = s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2);
      if (!swapped.startsWith('0')) return Math.sign(n) * Number(swapped);
    }
  }
  return null;
}

/** Four shuffled options: the answer plus three rule-based distractors. */
export function buildOptions(answer: string, wrong: WrongPath[], rng: Rng): ChoiceOption[] {
  const a = parseRational(answer);
  if (!a) throw new Error(`Bad answer: ${answer}`);
  const candidates: ChoiceOption[] = wrong.map((w) => ({ value: w.value, error: w.error }));
  candidates.push({ value: toCanonical(rat(-a.n, a.d)), error: 'sign' });
  candidates.push({ value: toCanonical(mul(a, rat(10))), error: 'decimal' });
  const swapped = a.d === 1 ? swapAdjacentDigits(a.n) : null;
  if (swapped !== null) candidates.push({ value: String(swapped), error: 'digitSwap' });
  candidates.push({ value: toCanonical(rat(a.n + a.d, a.d)), error: 'rounding' });
  // Fallbacks so there are always three distractors, even for 0 or 1.
  candidates.push({ value: toCanonical(rat(a.n - a.d, a.d)), error: 'rounding' });
  candidates.push({ value: toCanonical(rat(a.n + 2 * a.d, a.d)) });
  candidates.push({ value: toCanonical(mul(a, rat(1, 10))), error: 'decimal' });

  const seen = new Set([toCanonical(a)]);
  const picked: ChoiceOption[] = [];
  for (const c of candidates) {
    const r = parseRational(c.value);
    if (!r) continue;
    const key = toCanonical(r);
    if (seen.has(key)) continue;
    seen.add(key);
    picked.push({ ...c, value: key });
    if (picked.length === 3) break;
  }
  return shuffle(rng, [{ value: toCanonical(a) }, ...picked]);
}
