// Task 9: linear and quadratic equations.
import { pick, randInt } from '../../src/lib/rng.ts';
import { rat } from '../../src/lib/rational.ts';
import { hl, labelled, lead, term, T, wrong } from '../helpers.ts';
import type { TaskTemplate } from '../types.ts';

const t = 't9';
const pickRoot = (rng: () => number) => (rng() < 0.5 ? 'меньший' : 'больший');
const sgn = (n: number) => (n < 0 ? `−${-n}` : String(n));

export const t09: TaskTemplate[] = [
  // ---- 9.1 linear ----
  T('t9-0-simple', t, 0, 'input', (rng) => {
    const x = randInt(rng, -9, 15);
    const b = randInt(rng, 2, 20);
    return {
      text: `Решите уравнение x ${term(b)} = ${hl(x + b)}.`,
      question: 'Найдите x.',
      answer: String(x), expr: `${x + b} - ${b}`,
      hint: 'Перенесите число в правую часть с противоположным знаком.',
      steps: [`x = ${x + b} − ${b} = ${x}`],
      wrong: [wrong(x + 2 * b, 'sign', 'При переносе через знак «=» знак меняется.')],
    };
  }),
  T('t9-1-a-bx-c', t, 1, 'input', (rng) => {
    const b = randInt(rng, 2, 9);
    const x = randInt(rng, -9, 13) || 5;
    const a = randInt(rng, 2, 60);
    const c = a + b * x;
    return {
      text: `Решите уравнение ${hl(a)} ${term(b, 'x')} = ${hl(c)}.`,
      question: 'Найдите корень уравнения.',
      answer: String(x), expr: `(${c} - ${a}) / ${b}`,
      hint: 'Перенесите число в правую часть, затем разделите на коэффициент при x.',
      steps: [`${b}x = ${c} − ${a} = ${c - a}`, `x = ${c - a} : ${b} = ${x}`],
      wrong: [wrong(rat(c + a, b), 'sign', 'При переносе знак числа меняется.')],
    };
  }),
  T('t9-1-bx-cx', t, 2, 'input', (rng) => {
    const b = randInt(rng, 2, 34);
    let c = randInt(rng, 2, 34);
    if (c === b) c += 1;
    const x = randInt(rng, -8, 8) || -2;
    const a = (c - b) * x;
    return {
      text: `Решите уравнение ${hl(a)} ${term(b, 'x')} = ${lead(c, 'x')}.`,
      question: 'Найдите корень уравнения.',
      answer: String(x), expr: `${a} / (${c} - ${b})`,
      hint: 'Соберите слагаемые с x в одной части, числа — в другой.',
      steps: [`${a} = ${c}x − ${b}x = ${c - b}x`, `x = ${a} : ${sgn(c - b)} = ${x}`],
      wrong: [wrong(-x, 'sign', 'Проверьте знак при переносе слагаемого с x.')],
    };
  }),
  T('t9-1-full', t, 3, 'input', (rng) => {
    const b = randInt(rng, 2, 9);
    let c = randInt(rng, 2, 9);
    if (c === b) c = b + 1;
    const x = randInt(rng, -7, 7) || 3;
    const a = randInt(rng, 1, 20);
    const d = a + (b - c) * x;
    return {
      text: `Решите уравнение ${hl(a)} ${term(b, 'x')} = ${lead(c, 'x')} ${term(d)}.`,
      question: 'Найдите корень уравнения.',
      answer: String(x), expr: `(${d} - ${a}) / (${b} - ${c})`,
      hint: 'Перенесите всё с x влево, всё без x — вправо.',
      steps: [`${b}x − ${c}x = ${d} − ${a}`, `${sgn(b - c)}x = ${d - a}; x = ${x}`],
      wrong: [wrong(-x, 'sign', 'Проверьте знаки при переносе.'), wrong(rat(d + a, b - c), 'sign', 'Число a переносится с противоположным знаком.')],
    };
  }),

  // ---- 9.2 brackets ----
  T('t9-2-zero', t, 1, 'input', (rng) => {
    const a = randInt(rng, 2, 12);
    const b = randInt(rng, -12, 12) || 5;
    return {
      text: `Решите уравнение ${hl(a)}(x ${term(b)}) = 0.`,
      question: 'Найдите корень уравнения.',
      answer: String(-b), expr: `-(${b})`,
      hint: 'Произведение равно нулю, когда скобка равна нулю.',
      steps: [`x ${term(b)} = 0`, `x = ${sgn(-b)}`],
      wrong: [wrong(b, 'sign', 'Если x + b = 0, то x = −b.')],
    };
  }),
  T('t9-2-expanded', t, 2, 'input', (rng) => {
    const a = randInt(rng, 2, 7);
    const b = randInt(rng, 2, 9);
    const x = randInt(rng, -6, 8) || 1;
    const c = a * x + a * b;
    return {
      text: `Решите уравнение ${hl(a)}x + ${hl(a)}·${hl(b)} = ${hl(c)}.`,
      question: 'Найдите корень уравнения.',
      answer: String(x), expr: `(${c} - ${a} * ${b}) / ${a}`,
      hint: `Сначала вычислите ${a}·${b}, затем перенесите число вправо.`,
      steps: [`${a}x = ${c} − ${a * b} = ${c - a * b}`, `x = ${c - a * b} : ${a} = ${x}`],
      wrong: [wrong(rat(c - b, a), 'wrongFormula', `Нужно вычесть всё произведение ${a}·${b}, а не только ${b}.`)],
    };
  }),
  T('t9-2-divide', t, 3, 'input', (rng) => {
    const a = randInt(rng, 2, 7);
    const b = randInt(rng, 2, 17);
    const x = randInt(rng, -7, 12) || 2;
    const c = a * (x + b);
    return {
      text: `Решите уравнение ${hl(a)}(x + ${hl(b)}) = ${hl(c)}.`,
      question: 'Найдите корень уравнения.',
      answer: String(x), expr: `${c} / ${a} - ${b}`,
      hint: 'Разделите обе части на множитель перед скобкой.',
      steps: [`x + ${b} = ${c} : ${a} = ${c / a}`, `x = ${c / a} − ${b} = ${x}`],
      wrong: [wrong(rat(c - b, a), 'wrongFormula', 'Сначала делят на множитель, затем вычитают слагаемое из скобки.')],
    };
  }),

  // ---- 9.3 x² = a ----
  T('t9-3-choice', t, 1, 'choice', (rng) => {
    const r = pick(rng, [7, 8, 9, 11, 12, 13, 15, 16, 25]);
    const smaller = pickRoot(rng) === 'меньший';
    const correct = smaller ? -r : r;
    const labels = [String(r), String(-r), String(r + 2), String(-(r + 2))];
    return {
      text: `Решите уравнение x² = ${hl(r * r)}.`,
      question: `В ответе укажите ${smaller ? 'меньший' : 'больший'} корень.`,
      ...labelled(labels, labels.indexOf(String(correct)) + 1),
      hint: 'У уравнения два корня: √a и −√a.',
      steps: [`x = ±√${r * r} = ±${r}`, `${smaller ? 'Меньший' : 'Больший'} корень: ${sgn(correct)}`],
      wrong: [],
    };
  }),
  T('t9-3-input', t, 2, 'input', (rng) => {
    const r = pick(rng, [6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 25]);
    const smaller = pickRoot(rng) === 'меньший';
    return {
      text: `Решите уравнение x² = ${hl(r * r)}.`,
      question: `В ответе укажите ${smaller ? 'меньший' : 'больший'} корень.`,
      answer: String(smaller ? -r : r), expr: `${smaller ? '-' : ''}sqrt(${r * r})`,
      hint: 'Извлеките корень и не забудьте про отрицательный корень.',
      steps: [`x = ±${r}`, `${smaller ? 'Меньший' : 'Больший'}: ${sgn(smaller ? -r : r)}`],
      wrong: [wrong(smaller ? r : -r, 'sign', 'Перепутаны меньший и больший корни.')],
    };
  }),
  T('t9-3-moved', t, 3, 'input', (rng) => {
    const r = pick(rng, [9, 11, 12, 13, 15, 16, 17, 19, 20, 25]);
    const smaller = pickRoot(rng) === 'меньший';
    return {
      text: `Решите уравнение x² − ${hl(r * r)} = 0.`,
      question: `В ответе укажите ${smaller ? 'меньший' : 'больший'} корень.`,
      answer: String(smaller ? -r : r), expr: `${smaller ? '-' : ''}sqrt(${r * r})`,
      hint: 'Перенесите число вправо: x² = a, затем x = ±√a.',
      steps: [`x² = ${r * r}`, `x = ±${r}; ${smaller ? 'меньший' : 'больший'} корень ${sgn(smaller ? -r : r)}`],
      wrong: [wrong(smaller ? r : -r, 'sign', 'Перепутаны меньший и больший корни.'), wrong(r * r, 'wrongFormula', 'Корень из числа не извлечён.')],
    };
  }),

  // ---- 9.4 x² = bx ----
  ...([1, 2, 3] as const).map((level) =>
    T(`t9-4-factor-${level}`, t, level, 'input', (rng) => {
      const a = level === 1 ? 1 : randInt(rng, 2, 9);
      const b = randInt(rng, 2, 12) * pick(rng, [1, -1]);
      const smaller = pickRoot(rng) === 'меньший';
      const roots = [0, b];
      const ans = smaller ? Math.min(...roots) : Math.max(...roots);
      const text =
        level === 3
          ? `Решите уравнение ${lead(a, 'x²')} = ${lead(a * b, 'x')}.`
          : `Решите уравнение ${lead(a, 'x²')} ${term(-a * b, 'x')} = 0.`;
      return {
        text,
        question: `В ответе укажите ${smaller ? 'меньший' : 'больший'} корень.`,
        answer: String(ans), expr: String(ans),
        hint: 'Вынесите x за скобку: x(x − b) = 0.',
        steps: [level === 3 ? `${lead(a, 'x²')} − ${lead(a * b, 'x')} = 0` : 'Выносим общий множитель', `${a === 1 ? '' : a}x(x ${term(-b)}) = 0 ⇒ x = 0 или x = ${sgn(b)}`, `${smaller ? 'Меньший' : 'Больший'}: ${sgn(ans)}`],
        wrong: [wrong(smaller ? Math.max(...roots) : Math.min(...roots), 'sign', 'Перепутаны меньший и больший корни.'), wrong(-b, 'sign', 'Если x − b = 0, то x = b.')],
      };
    }),
  ),

  // ---- 9.5 full quadratic ----
  T('t9-5-square', t, 1, 'input', (rng) => {
    const r = randInt(rng, 2, 13);
    return {
      text: `Решите уравнение x² − ${hl(2 * r)}x + ${hl(r * r)} = 0.`,
      question: 'Запишите корень уравнения.',
      answer: String(r), expr: String(r),
      hint: 'D = b² − 4ac = 0, значит корень один: x = −b / 2a.',
      steps: [`D = ${2 * r}² − 4·${r * r} = 0`, `x = ${2 * r} : 2 = ${r}`],
      wrong: [wrong(-r, 'sign', 'x = −b/(2a), а b здесь отрицательное.')],
    };
  }),
  T('t9-5-discriminant', t, 2, 'input', (rng) => {
    const r1 = randInt(rng, -3, 6);
    const r2 = r1 + randInt(rng, 2, 7);
    const p = -(r1 + r2);
    const q = r1 * r2;
    const smaller = pickRoot(rng) === 'меньший';
    const D = p * p - 4 * q;
    return {
      text: `Решите уравнение x² ${term(p, 'x')} ${term(q)} = 0.`.replace(/\s+=/, ' ='),
      question: `В ответе укажите ${smaller ? 'меньший' : 'больший'} корень.`,
      answer: String(smaller ? r1 : r2), expr: `(${-p} ${smaller ? '-' : '+'} sqrt(${D})) / 2`,
      hint: 'Найдите дискриминант D = b² − 4ac, затем x = (−b ± √D) / 2.',
      steps: [`D = ${sgn(p)}² − 4·${sgn(q)} = ${D}, √D = ${Math.sqrt(D)}`, `x₁ = (${sgn(-p)} − ${Math.sqrt(D)}) / 2 = ${r1}, x₂ = (${sgn(-p)} + ${Math.sqrt(D)}) / 2 = ${r2}`, `${smaller ? 'Меньший' : 'Больший'}: ${sgn(smaller ? r1 : r2)}`],
      wrong: [wrong(smaller ? r2 : r1, 'sign', 'Перепутаны меньший и больший корни.'), wrong(smaller ? -r1 : -r2, 'sign', 'Знак корня противоположен знаку в формуле x = (−b ± √D)/2a.')],
    };
  }),
  T('t9-5-vieta', t, 3, 'input', (rng) => {
    const r1 = randInt(rng, -9, -1);
    const r2 = randInt(rng, 1, 11);
    const p = -(r1 + r2);
    const q = r1 * r2;
    const smaller = pickRoot(rng) === 'меньший';
    return {
      text: `Решите уравнение x² ${term(p, 'x')} ${term(q)} = 0.`.replace(/\s+=/, ' ='),
      question: `В ответе укажите ${smaller ? 'меньший' : 'больший'} корень.`,
      answer: String(smaller ? r1 : r2), expr: String(smaller ? r1 : r2),
      hint: `По теореме Виета: x₁ + x₂ = ${sgn(-p)}, x₁ · x₂ = ${sgn(q)}. Корни разных знаков.`,
      steps: [`x₁ · x₂ = ${sgn(q)}, x₁ + x₂ = ${sgn(-p)}`, `Подбираем: x₁ = ${r1}, x₂ = ${r2}`, `${smaller ? 'Меньший' : 'Больший'}: ${sgn(smaller ? r1 : r2)}`],
      wrong: [wrong(smaller ? r2 : r1, 'sign', 'Перепутаны меньший и больший корни.'), wrong(smaller ? -r2 : -r1, 'sign', 'По Виета сумма корней равна −p.')],
    };
  }),
];
