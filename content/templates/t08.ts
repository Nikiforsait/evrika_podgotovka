// Task 8: powers and roots with variables.
import { pick, randInt } from '../../src/lib/rng.ts';
import { rat } from '../../src/lib/rational.ts';
import { canon, hl, pow, show, sup, T, wrong } from '../helpers.ts';
import type { TaskTemplate } from '../types.ts';

const t = 't8';
const at = (vars: Record<string, number | string>) => Object.entries(vars).map(([k, v]) => `${k} = ${typeof v === 'number' ? hl(v) : v}`).join(', ');
const neg = (n: number) => (n < 0 ? `(${n})` : String(n));

export const t08: TaskTemplate[] = [
  // ---- 8.1 product of powers ----
  T('t8-1-single', t, 0, 'input', (rng) => {
    const a = randInt(rng, 2, 6);
    const m = randInt(rng, 2, a > 3 ? 3 : 5);
    return {
      text: `Найдите значение выражения ${pow('a', m)} при ${at({ a })}.`,
      question: 'Запишите ответ числом.',
      answer: String(a ** m), expr: `${a}**${m}`,
      hint: `Степень — это произведение ${m} одинаковых множителей.`,
      steps: [`${Array(m).fill(a).join(' · ')} = ${a ** m}`],
      wrong: [wrong(a * m, 'wrongFormula', 'Степень — это не умножение основания на показатель.')],
    };
  }),
  T('t8-1-two', t, 1, 'input', (rng) => {
    const a = pick(rng, [2, 3, 5]);
    const m = randInt(rng, 2, 7);
    const n = randInt(rng, -4, 4) || 1;
    const e = m + n;
    if (e < 0 || e > (a === 2 ? 8 : a === 3 ? 5 : 4)) throw new Error('retry');
    return {
      text: `Найдите значение выражения ${pow('a', m)} · ${pow('a', n)} при ${at({ a })}.`,
      question: 'Запишите ответ числом.',
      answer: String(a ** e), expr: `${a}**(${m} + ${neg(n)})`,
      hint: 'При умножении степеней с одинаковым основанием показатели складывают.',
      steps: [`a${sup(m)} · a${sup(n)} = a${sup(e)}`, `${a}${sup(e)} = ${a ** e}`],
      wrong: [wrong(a ** (m * n > 0 ? Math.min(m * Math.abs(n), 12) : 1), 'wrongFormula', 'Показатели складывают, а не перемножают.')],
    };
  }),
  T('t8-1-three', t, 2, 'input', (rng) => {
    const a = pick(rng, [2, 3, 5, 7, 9]);
    const m = randInt(rng, 4, 12);
    const n = randInt(rng, 3, 16);
    const target = randInt(rng, 1, a === 2 ? 6 : a === 3 ? 4 : 2);
    const k = target - m - n;
    return {
      text: `Найдите значение выражения ${pow('a', m)} · ${pow('a', n)} · a${sup(k)} при ${at({ a })}.`,
      question: 'Запишите ответ числом.',
      answer: String(a ** target), expr: `${a}**(${m} + ${n} + ${neg(k)})`,
      hint: 'Сложите все показатели: при умножении степеней с одинаковым основанием показатели складываются.',
      steps: [`${m} + ${n} + (${k}) = ${target}`, `${a}${sup(target)} = ${a ** target}`],
      wrong: [wrong(a ** (target + 1), 'rounding', 'Проверьте сумму показателей.')],
    };
  }),
  T('t8-1-nested', t, 3, 'input', (rng) => {
    const a = pick(rng, [2, 3, 5, 9]);
    const inner = randInt(rng, 2, 8);
    const outer = randInt(rng, 2, 3);
    const target = randInt(rng, 1, a === 2 ? 6 : a === 3 ? 4 : 2);
    const k = target - inner * outer;
    return {
      text: `Найдите значение выражения (${pow('a', inner)})${sup(outer)} · a${sup(k)} при ${at({ a })}.`,
      question: 'Запишите ответ числом.',
      answer: String(a ** target), expr: `${a}**(${inner} * ${outer} + ${neg(k)})`,
      hint: 'При возведении степени в степень показатели перемножают, затем сложите с третьим показателем.',
      steps: [`(a${sup(inner)})${sup(outer)} = a${sup(inner * outer)}`, `${inner * outer} + (${k}) = ${target}; ${a}${sup(target)} = ${a ** target}`],
      wrong: [wrong(a ** Math.min(Math.abs(inner + outer + k), 8), 'wrongFormula', 'В степени степени показатели перемножают.')],
    };
  }),

  // ---- 8.2 quotients of powers ----
  T('t8-2-quotient', t, 1, 'input', (rng) => {
    const a = pick(rng, [2, 3, 5, 7, 9]);
    const n = randInt(rng, 2, 9);
    const e = randInt(rng, 1, a === 2 ? 6 : 3);
    return {
      text: `Найдите значение выражения ${pow('a', n + e)} : ${pow('a', n)} при ${at({ a })}.`,
      question: 'Запишите ответ числом.',
      answer: String(a ** e), expr: `${a}**(${n + e} - ${n})`,
      hint: 'При делении степеней с одинаковым основанием показатели вычитают.',
      steps: [`a${sup(n + e)} : a${sup(n)} = a${sup(e)}`, `${a}${sup(e)} = ${a ** e}`],
      wrong: [wrong(a ** Math.min(n + e + n, 10), 'sign', 'При делении показатели вычитают, а не складывают.')],
    };
  }),
  T('t8-2-three', t, 2, 'input', (rng) => {
    const a = pick(rng, [2, 3, 4, 5, 8, 10]);
    const m = randInt(rng, 2, 8);
    const n = randInt(rng, 2, 8);
    const e = randInt(rng, 1, a <= 3 ? 4 : 2);
    const k = m + n - e;
    return {
      text: `Найдите значение выражения ${pow('a', m)} · ${pow('a', n)} : ${pow('a', k)} при ${at({ a })}.`,
      question: 'Запишите ответ числом.',
      answer: String(a ** e), expr: `${a}**(${m} + ${n} - ${k})`,
      hint: 'Показатели в числителе складывают, показатель знаменателя вычитают.',
      steps: [`${m} + ${n} − ${k} = ${e}`, `${a}${sup(e)} = ${a ** e}`],
      wrong: [wrong(a ** Math.min(m + n + k, 8), 'sign', 'Показатель делителя нужно вычесть.')],
    };
  }),
  T('t8-2-two-vars', t, 3, 'input', (rng) => {
    const a = pick(rng, [2, 3, 5, 7]);
    const bsq = pick(rng, [2, 3, 5]); // b = √bsq
    const ea = randInt(rng, 1, a <= 3 ? 4 : 2);
    const eb = pick(rng, [2, 4]);
    const m = randInt(rng, 5, 12);
    const n = randInt(rng, 3, 9);
    const k = m + n - ea;
    const p = randInt(rng, 5, 9);
    const q = p - eb;
    const res = a ** ea * bsq ** (eb / 2);
    return {
      text: `Найдите значение выражения ${pow('a', m)} · ${pow('a', n)} · ${pow('b', p)} : (${pow('a', k)} · ${pow('b', q)}) при ${at({ a, b: `√${bsq}` })}.`,
      question: 'Запишите ответ числом.',
      answer: String(res), expr: `${a}**(${m} + ${n} - ${k}) * sqrt(${bsq})**(${p} - ${q})`,
      hint: 'Упростите отдельно степени a и степени b, затем подставьте: (√b)² = b.',
      steps: [`a${sup(m + n - k)} · b${sup(eb)} = a${sup(ea)} · b${sup(eb)}`, `${a}${sup(ea)} · (√${bsq})${sup(eb)} = ${a ** ea} · ${bsq ** (eb / 2)} = ${res}`],
      wrong: [wrong(a ** ea * bsq ** eb, 'wrongFormula', '(√b)² = b, а не b².')],
    };
  }),

  // ---- 8.3 roots of powers ----
  T('t8-3-root-power', t, 0, 'input', (rng) => {
    const a = pick(rng, [2, 3, 4, 5, 7]);
    const half = randInt(rng, 2, a === 2 ? 6 : a === 3 ? 5 : 3);
    return {
      text: `Найдите значение выражения √(${pow('a', 2 * half)}) при ${at({ a })}.`,
      question: 'Запишите ответ числом.',
      answer: String(a ** half), expr: `sqrt(${a}**${2 * half})`,
      hint: 'Корень из чётной степени: показатель делится на 2.',
      steps: [`√(a${sup(2 * half)}) = a${sup(half)}`, `${a}${sup(half)} = ${a ** half}`],
      wrong: [wrong(a ** (2 * half), 'wrongFormula', 'Корень не извлечён: показатель нужно разделить на 2.')],
    };
  }),
  T('t8-3-coef', t, 1, 'input', (rng) => {
    const c = pick(rng, [2, 3, 4, 5, 7]);
    const a = pick(rng, [2, 3, 5]);
    const half = randInt(rng, 1, a === 2 ? 5 : 3);
    return {
      text: `Найдите значение выражения √(${hl(c * c)}${pow('a', 2 * half)}) при ${at({ a })}.`,
      question: 'Запишите ответ числом.',
      answer: String(c * a ** half), expr: `sqrt(${c * c} * ${a}**${2 * half})`,
      hint: `Извлеките корень из числа и из степени отдельно: √${c * c} = ${c}.`,
      steps: [`√(${c * c}a${sup(2 * half)}) = ${c}a${sup(half)}`, `${c} · ${a ** half} = ${c * a ** half}`],
      wrong: [wrong(c * c * a ** half, 'wrongFormula', `√${c * c} = ${c}, а не ${c * c}.`)],
    };
  }),
  T('t8-3-quotient', t, 2, 'input', (rng) => {
    const c = pick(rng, [2, 3, 4, 5]);
    const a = pick(rng, [2, 3, 4, 5, 6, 20]);
    const half = a >= 6 ? 1 : randInt(rng, 1, a === 2 ? 4 : 2);
    const low = randInt(rng, 1, 13);
    const high = low + 2 * half;
    return {
      text: `Найдите значение выражения √(${hl(c * c)}${pow('a', high)} : ${pow('a', low)}) при ${at({ a })}.`,
      question: 'Запишите ответ числом.',
      answer: String(c * a ** half), expr: `sqrt(${c * c} * ${a}**${high} / ${a}**${low})`,
      hint: 'Сначала упростите степень под корнем (вычтите показатели), потом извлеките корень.',
      steps: [`a${sup(high)} : a${sup(low)} = a${sup(2 * half)}`, `√(${c * c}a${sup(2 * half)}) = ${c}a${sup(half)} = ${c * a ** half}`],
      wrong: [wrong(c * a ** (2 * half), 'wrongFormula', 'После упрощения нужно ещё извлечь корень.')],
    };
  }),
  T('t8-3-two-vars', t, 3, 'input', (rng) => {
    const c = pick(rng, [2, 3, 4, 5, 10]);
    const a = pick(rng, [2, 3]);
    const b = pick(rng, [2, 4, 5]);
    const ha = randInt(rng, 1, 4);
    const hb = randInt(rng, 1, 3);
    const res = rat(c * a ** ha, b ** hb);
    return {
      text: `Найдите значение выражения √(${hl(c * c)}${pow('a', 2 * ha)} : ${pow('b', 2 * hb)}) при ${at({ a, b })}.`,
      question: 'Запишите ответ числом или десятичной дробью.',
      answer: canon(res), expr: `sqrt(${c * c} * ${a}**${2 * ha} / ${b}**${2 * hb})`,
      hint: 'Извлеките корень из каждого множителя: из c² получится c, а показатели у a и b уменьшатся вдвое.',
      steps: [`√(…) = ${c}a${sup(ha)} : b${sup(hb)}`, `${c} · ${a ** ha} : ${b ** hb} = ${show(res)}`],
      wrong: [wrong((c * c * a ** ha) / b ** hb, 'wrongFormula', `√${c * c} = ${c}.`)],
    };
  }),

  // ---- 8.4–8.6 ----
  T('t8-4-two-vars', t, 2, 'input', (rng) => {
    const a = pick(rng, [2, 3, 5, 7]);
    const b = pick(rng, [2, 3, 4, 6, 8]);
    const ha = randInt(rng, 1, 3);
    const hb = randInt(rng, 1, 2);
    return {
      text: `Найдите значение выражения √(${pow('a', 2 * ha)}${pow('b', 2 * hb)}) при ${at({ a, b })}.`,
      question: 'Запишите ответ числом.',
      answer: String(a ** ha * b ** hb), expr: `sqrt(${a}**${2 * ha} * ${b}**${2 * hb})`,
      hint: 'Корень из произведения равен произведению корней.',
      steps: [`√(a${sup(2 * ha)}b${sup(2 * hb)}) = a${sup(ha)}b${sup(hb)}`, `${a ** ha} · ${b ** hb} = ${a ** ha * b ** hb}`],
      wrong: [wrong(a ** ha + b ** hb, 'wrongFormula', 'Множители перемножают, а не складывают.')],
    };
  }),
  T('t8-4-fraction-coef', t, 3, 'input', (rng) => {
    const c = pick(rng, [2, 4, 5, 10]);
    const a = randInt(rng, 2, 7);
    const b = pick(rng, [2, 3, 4, 7]);
    const ha = randInt(rng, 1, 2);
    const hb = randInt(rng, 1, 2);
    const res = rat(a ** ha * b ** hb, c);
    return {
      text: `Найдите значение выражения √(${pow('a', 2 * ha)}${pow('b', 2 * hb)} : ${hl(c * c)}) при ${at({ a, b })}.`,
      question: 'Запишите ответ числом или десятичной дробью.',
      answer: canon(res), expr: `sqrt(${a}**${2 * ha} * ${b}**${2 * hb} / ${c * c})`,
      hint: `√(1/${c * c}) = 1/${c}.`,
      steps: [`√(…) = a${sup(ha)}b${sup(hb)} : ${c}`, `${a ** ha} · ${b ** hb} : ${c} = ${show(res)}`],
      wrong: [wrong(a ** ha * b ** hb, 'wrongFormula', `Не учтён делитель: √(1/${c * c}) = 1/${c}.`)],
    };
  }),
  T('t8-5-negative-base', t, 3, 'input', (rng) => {
    const a = pick(rng, [2, 3, 4]);
    const m = pick(rng, [2, 4, 6]);
    const n = pick(rng, [2, 4, 6]);
    const e = (m + n) / 2;
    if (a ** e > 2000) throw new Error('retry');
    return {
      text: `Найдите значение выражения √(${pow('a', m)} · (−a)${sup(n)}) при ${at({ a })}.`,
      question: 'Запишите ответ числом.',
      answer: String(a ** e), expr: `sqrt(${a}**${m} * (-${a})**${n})`,
      hint: 'Отрицательное число в чётной степени положительно: (−a)ⁿ = aⁿ при чётном n.',
      steps: [`(−a)${sup(n)} = a${sup(n)}; a${sup(m)} · a${sup(n)} = a${sup(m + n)}`, `√(a${sup(m + n)}) = a${sup(e)} = ${a ** e}`],
      wrong: [wrong(-(a ** e), 'sign', 'Арифметический корень неотрицателен, а чётная степень убирает минус.')],
    };
  }),
  T('t8-6-square-one', t, 2, 'input', (rng) => {
    const k = randInt(rng, 1, 6);
    const a = randInt(rng, -8, 8);
    const res = Math.abs(a - k);
    return {
      text: `Найдите значение выражения √(a² − ${hl(2 * k)}a + ${hl(k * k)}) при a = ${a < 0 ? `−${-a}` : a}.`,
      question: 'Запишите ответ числом.',
      answer: String(res), expr: `sqrt((${a} - ${k})**2)`,
      hint: `Под корнем — полный квадрат (a − ${k})². Корень из квадрата равен модулю.`,
      steps: [`a² − ${2 * k}a + ${k * k} = (a − ${k})²`, `√((a − ${k})²) = |a − ${k}| = |${a} − ${k}| = ${res}`],
      wrong: [wrong(a - k, 'sign', 'Корень из квадрата — модуль, он не может быть отрицательным.')],
    };
  }),
  T('t8-6-square-two', t, 3, 'input', (rng) => {
    const k = randInt(rng, 1, 5);
    const sign = pick(rng, [1, -1]);
    const a = randInt(rng, -6, 6);
    const b = randInt(rng, -4, 4) || 1;
    const res = Math.abs(a + sign * k * b);
    return {
      text: `Найдите значение выражения √(a² ${sign > 0 ? '+' : '−'} ${hl(2 * k)}ab + ${hl(k * k)}b²) при a = ${a < 0 ? `−${-a}` : a}, b = ${b < 0 ? `−${-b}` : b}.`,
      question: 'Запишите ответ числом.',
      answer: String(res), expr: `sqrt((${a} + ${sign * k} * ${neg(b)})**2)`,
      hint: 'Вспомните формулы сокращённого умножения: под корнем — квадрат двучлена.',
      steps: [`a² ${sign > 0 ? '+' : '−'} ${2 * k}ab + ${k * k}b² = (a ${sign > 0 ? '+' : '−'} ${k}b)²`, `|${a} ${sign > 0 ? '+' : '−'} ${k}·${neg(b)}| = ${res}`],
      wrong: [wrong(a + sign * k * b, 'sign', 'Корень из квадрата равен модулю выражения.')],
    };
  }),
];
