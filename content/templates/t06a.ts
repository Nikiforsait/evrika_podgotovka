// Task 6, part 1: fractions (add/sub, mult/div) and decimals (add/sub/mult).
import { pick, randInt } from '../../src/lib/rng.ts';
import { add, div, mul, rat, sub } from '../../src/lib/rational.ts';
import { canon, frac, gcd, hl, hlRaw, R, show, T, wrong } from '../helpers.ts';
import type { TaskTemplate } from '../types.ts';

const t = 't6';
const coprime = (rng: () => number, d: number) => {
  const opts = Array.from({ length: d - 1 }, (_, i) => i + 1).filter((n) => gcd(n, d) === 1);
  return opts[randInt(rng, 0, opts.length - 1)] ?? 1;
};
const dec1 = (rng: () => number, lo = 1, hi = 99) => randInt(rng, lo, hi) / 10; // one decimal place

export const t06a: TaskTemplate[] = [
  // ---- 6.1 addition / subtraction ----
  T('t6-1-int', t, 0, 'input', (rng) => {
    const a = randInt(rng, 21, 89);
    const b = randInt(rng, 12, 48);
    const plus = rng() < 0.5;
    const res = plus ? a + b : a - b;
    return {
      text: `Вычислите: ${hl(a)} ${plus ? '+' : '−'} ${hl(b)}.`,
      question: 'Запишите ответ числом.',
      answer: String(res), expr: `${a} ${plus ? '+' : '-'} ${b}`,
      hint: plus ? 'Складывайте по разрядам: сначала десятки, потом единицы.' : 'Вычитайте по частям: сначала десятки, потом единицы.',
      steps: [`${a} ${plus ? '+' : '−'} ${b} = ${res}`],
      wrong: [wrong(plus ? a - b : a + b, 'sign', 'Перепутан знак действия.')],
    };
  }),
  T('t6-1-numerator', t, 1, 'input', (rng) => {
    const b = pick(rng, [3, 4, 5, 6, 7, 8, 9, 10, 12]);
    const k = pick(rng, [2, 3, 4]);
    const d = b * k;
    const a = coprime(rng, b);
    const c = coprime(rng, d);
    const plus = rng() < 0.6 || a * k <= c;
    const res = plus ? a * k + c : a * k - c;
    return {
      text: `Представьте выражение ${hlRaw(a, b)} ${plus ? '+' : '−'} ${hlRaw(c, d)} в виде дроби со знаменателем ${hl(d)}.`,
      question: 'Запишите числитель получившейся дроби.',
      answer: String(res), expr: `${a} * ${k} ${plus ? '+' : '-'} ${c}`,
      hint: `Умножьте числитель и знаменатель первой дроби на ${k}.`,
      steps: [`${a}/${b} = ${a * k}/${d}`, `${a * k} ${plus ? '+' : '−'} ${c} = ${res}`],
      wrong: [wrong(plus ? a + c : a - c, 'wrongFormula', 'Сначала приведите первую дробь к знаменателю ' + d + '.')],
    };
  }),
  T('t6-1-fraction', t, 2, 'input', (rng) => {
    const b = pick(rng, [4, 5, 6, 8, 9, 10, 12]);
    const d = b * pick(rng, [2, 3]);
    const a = coprime(rng, b);
    const c = coprime(rng, d);
    const plus = rng() < 0.5 || rat(a, b).n * d <= c * b;
    const res = plus ? add(rat(a, b), rat(c, d)) : sub(rat(a, b), rat(c, d));
    return {
      text: `Найдите значение выражения ${hlRaw(a, b)} ${plus ? '+' : '−'} ${hlRaw(c, d)}.`,
      question: 'Ответ запишите несократимой дробью.',
      answer: canon(res), expr: `${R(a, b)} ${plus ? '+' : '-'} ${R(c, d)}`, display: 'fraction',
      hint: `Общий знаменатель — ${d}.`,
      steps: [`${a}/${b} = ${(a * d) / b}/${d}`, `${(a * d) / b}/${d} ${plus ? '+' : '−'} ${c}/${d} = ${frac(res)}`],
      wrong: [wrong(rat(plus ? a + c : a - c, b + d), 'wrongFormula', 'Нельзя складывать числители и знаменатели по отдельности.')],
    };
  }),
  T('t6-1-decimal', t, 3, 'input', (rng) => {
    const pairs = [[4, 20], [5, 40], [2, 50], [8, 40], [16, 8], [20, 10], [25, 50], [8, 20]] as const;
    const [b, d] = pick(rng, pairs);
    const a = coprime(rng, b);
    const c = coprime(rng, d);
    const plus = rng() < 0.5 || a * d <= c * b;
    const res = plus ? add(rat(a, b), rat(c, d)) : sub(rat(a, b), rat(c, d));
    return {
      text: `Найдите значение выражения ${hlRaw(a, b)} ${plus ? '+' : '−'} ${hlRaw(c, d)}.`,
      question: 'Ответ запишите десятичной дробью.',
      answer: canon(res), expr: `${R(a, b)} ${plus ? '+' : '-'} ${R(c, d)}`,
      hint: 'Приведите к общему знаменателю, затем переведите результат в десятичную дробь.',
      steps: [`Общий знаменатель — ${(b * d) / gcd(b, d)}`, `Результат: ${frac(res)} = ${show(res)}`],
      wrong: [wrong(rat(plus ? a + c : a - c, b + d), 'wrongFormula', 'Знаменатели не складывают.')],
    };
  }),

  // ---- 6.2 multiplication / division ----
  T('t6-2-int', t, 0, 'input', (rng) => {
    const a = randInt(rng, 12, 45);
    const b = pick(rng, [20, 30, 40, 50]);
    return {
      text: `Вычислите: ${hl(a)} · ${hl(b)}.`,
      question: 'Запишите ответ числом.',
      answer: String(a * b), expr: `${a} * ${b}`,
      hint: 'Умножьте без нуля, затем припишите нуль к результату.',
      steps: [`${a} · ${b / 10} = ${(a * b) / 10}`, `Приписываем нуль: ${a * b}`],
      wrong: [wrong((a * b) / 10, 'decimal', 'Потерян нуль от второго множителя.')],
    };
  }),
  T('t6-2-product-decimal', t, 1, 'input', (rng) => {
    const pairs = [[3, 4, 5, 6], [2, 5, 7, 4], [4, 5, 3, 4], [5, 8, 4, 5], [2, 3, 3, 8], [5, 6, 9, 10], [3, 16, 2, 3], [4, 25, 5, 8], [9, 20, 5, 6], [7, 8, 2, 7]] as const;
    const [a, b, c, d] = pick(rng, pairs);
    const res = mul(rat(a, b), rat(c, d));
    return {
      text: `Найдите значение выражения ${hlRaw(a, b)} · ${hlRaw(c, d)}.`,
      question: 'Ответ запишите десятичной дробью.',
      answer: canon(res), expr: `${R(a, b)} * ${R(c, d)}`,
      hint: 'Перемножьте числители и знаменатели, сократите, переведите в десятичную дробь.',
      steps: [`${a * c}/${b * d} = ${frac(res)} = ${show(res)}`],
      wrong: [wrong(add(rat(a, b), rat(c, d)), 'wrongFormula', 'Это сумма дробей, а нужно произведение.')],
    };
  }),
  T('t6-2-product-fraction', t, 2, 'input', (rng) => {
    const pairs = [[4, 9, 3, 8], [7, 12, 8, 21], [3, 10, 5, 6], [8, 15, 9, 20], [11, 18, 6, 11], [5, 14, 21, 25], [9, 16, 2, 3], [15, 28, 7, 12], [21, 40, 8, 21], [5, 6, 9, 10]] as const;
    const [a, b, c, d] = pick(rng, pairs);
    const res = mul(rat(a, b), rat(c, d));
    return {
      text: `Найдите значение выражения ${hlRaw(a, b)} · ${hlRaw(c, d)}.`,
      question: 'Ответ запишите несократимой дробью.',
      answer: canon(res), expr: `${R(a, b)} * ${R(c, d)}`, display: 'fraction',
      hint: 'Сократите крест-накрест до умножения.',
      steps: [`${a}·${c} / (${b}·${d}) = ${a * c}/${b * d} = ${frac(res)}`],
      wrong: [wrong(rat(a * c, b + d), 'wrongFormula', 'Знаменатели перемножают, а не складывают.')],
    };
  }),
  T('t6-2-division', t, 3, 'input', (rng) => {
    const pairs = [[5, 6, 10, 9], [9, 10, 18, 25], [4, 15, 8, 25], [6, 7, 12, 35], [13, 15, 26, 45], [8, 9, 4, 27], [3, 8, 9, 16], [7, 12, 14, 15], [5, 12, 15, 16], [2, 9, 4, 15]] as const;
    const [a, b, c, d] = pick(rng, pairs);
    const res = div(rat(a, b), rat(c, d));
    return {
      text: `Найдите значение выражения ${hlRaw(a, b)} : ${hlRaw(c, d)}.`,
      question: 'Ответ запишите числом или несократимой дробью.',
      answer: canon(res), expr: `${R(a, b)} / ${R(c, d)}`, display: 'fraction',
      hint: 'Деление замените умножением на перевёрнутую дробь, затем сократите.',
      steps: [`${a}/${b} · ${d}/${c} = ${a * d}/${b * c}`, `Сокращаем: ${frac(res)}`],
      wrong: [wrong(mul(rat(a, b), rat(c, d)), 'wrongFormula', 'При делении вторую дробь переворачивают.')],
    };
  }),

  // ---- 6.3 decimals ----
  T('t6-3-dec-add', t, 0, 'input', (rng) => {
    const a = dec1(rng, 11, 79);
    const b = dec1(rng, 11, 79);
    const plus = rng() < 0.5 || a <= b;
    const [x, y] = plus ? [a, b] : [Math.max(a, b), Math.min(a, b)];
    const res = Math.round((plus ? x + y : x - y) * 10) / 10;
    return {
      text: `Найдите значение выражения ${hl(x)} ${plus ? '+' : '−'} ${hl(y)}.`,
      question: 'Запишите ответ числом.',
      answer: canon(res), expr: `${R(Math.round(x * 10), 10)} ${plus ? '+' : '-'} ${R(Math.round(y * 10), 10)}`,
      hint: 'Считайте столбиком: запятая под запятой.',
      steps: [`${show(x)} ${plus ? '+' : '−'} ${show(y)} = ${show(res)}`],
      wrong: [wrong(res * 10, 'decimal', 'Потеряна запятая в ответе.')],
    };
  }),
  T('t6-3-dec-mul-int', t, 1, 'input', (rng) => {
    const a = dec1(rng, 11, 69);
    const k = randInt(rng, 2, 9);
    const res = Math.round(a * k * 10) / 10;
    return {
      text: `Найдите значение выражения ${hl(a)} · ${hl(k)}.`,
      question: 'Запишите ответ числом.',
      answer: canon(res), expr: `${R(Math.round(a * 10), 10)} * ${k}`,
      hint: 'Умножьте как натуральные числа, затем отделите запятой один знак.',
      steps: [`${Math.round(a * 10)} · ${k} = ${Math.round(a * 10) * k}`, `Отделяем один знак: ${show(res)}`],
      wrong: [wrong(Math.round(a * 10) * k, 'decimal', 'Не отделён знак после запятой.')],
    };
  }),
  T('t6-3-dec-mul-dec', t, 2, 'input', (rng) => {
    const a = dec1(rng, 11, 49);
    const b = dec1(rng, 11, 49);
    const res = Math.round(a * b * 100) / 100;
    return {
      text: `Найдите значение выражения ${hl(a)} · ${hl(b)}.`,
      question: 'Запишите ответ числом.',
      answer: canon(res), expr: `${R(Math.round(a * 10), 10)} * ${R(Math.round(b * 10), 10)}`,
      hint: 'Умножьте как натуральные числа, затем отделите 1 + 1 = 2 знака.',
      steps: [`${Math.round(a * 10)} · ${Math.round(b * 10)} = ${Math.round(a * 10) * Math.round(b * 10)}`, `Отделяем два знака: ${show(res)}`],
      wrong: [wrong(res * 10, 'decimal', 'Нужно отделить два знака, по одному от каждого множителя.')],
    };
  }),
  T('t6-3-dec-small', t, 3, 'input', (rng) => {
    const a = pick(rng, [0.4, 0.9, 2.5, 0.6, 1.2, 0.7, 3.5, 0.05, 4.5, 1.6]);
    const b = pick(rng, [0.25, 0.08, 0.4, 0.15, 0.14, 0.03, 3.5, 1.6, 0.12]);
    const res = Math.round(a * b * 10000) / 10000;
    const digitsA = String(a).split('.')[1]?.length ?? 0;
    const digitsB = String(b).split('.')[1]?.length ?? 0;
    return {
      text: `Найдите значение выражения ${hl(a)} · ${hl(b)}.`,
      question: 'Запишите ответ числом.',
      answer: canon(res), expr: `${R(Math.round(a * 100), 100)} * ${R(Math.round(b * 100), 100)}`,
      hint: `Умножьте как натуральные числа, затем отделите ${digitsA} + ${digitsB} = ${digitsA + digitsB} знака.`,
      steps: [`${Math.round(a * 10 ** digitsA)} · ${Math.round(b * 10 ** digitsB)} = ${Math.round(a * 10 ** digitsA) * Math.round(b * 10 ** digitsB)}`, `Отделяем ${digitsA + digitsB} знака: ${show(res)}`],
      wrong: [wrong(res * 10, 'decimal', 'Отделено на один знак меньше, чем нужно.'), wrong(res / 10, 'decimal', 'Отделено на один знак больше, чем нужно.')],
    };
  }),
];
