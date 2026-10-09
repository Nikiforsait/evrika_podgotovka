// Task 11: functions and their graphs, described in words (no pictures needed).
import { pick, randInt, shuffle } from '../../src/lib/rng.ts';
import { digits, hl, labelled, lead, term, T, wrong } from '../helpers.ts';
import { graphsFigure, type Curve } from '../figures.ts';
import type { TaskTemplate } from '../types.ts';

const t = 't11';
const lin = (k: number, b: number) => `y = ${lead(k, 'x')} ${term(b)}`.trim();
const describeLine = (k: number, b: number) =>
  `прямая, которая ${k > 0 ? 'идёт вверх (возрастает)' : 'идёт вниз (убывает)'} и пересекает ось y ${b > 0 ? 'выше' : 'ниже'} нуля`;
const describeParabola = (a: number, c: number) =>
  `парабола, ветви направлены ${a > 0 ? 'вверх' : 'вниз'}, пересекает ось y ${c > 0 ? 'выше' : 'ниже'} нуля`;

export const t11: TaskTemplate[] = [
  T('t11-0-value', t, 0, 'input', (rng) => {
    const k = randInt(rng, -5, 6) || 2;
    const b = randInt(rng, -9, 9);
    const x = randInt(rng, -4, 6);
    return {
      text: `Дана функция ${lin(k, b)}.`,
      question: `Найдите значение функции при x = ${hl(x)}.`,
      answer: String(k * x + b), expr: `${k} * ${x} + ${b}`,
      hint: 'Подставьте x в формулу и вычислите.',
      steps: [`y = ${k} · ${x < 0 ? `(${x})` : x} ${term(b)} = ${k * x + b}`],
      wrong: [wrong(k * x - b, 'sign', 'Проверьте знак свободного члена.')],
    };
  }),
  T('t11-1-line-signs', t, 1, 'choice', (rng) => {
    const k = pick(rng, [-3, -2, -1, 1, 2, 3]);
    const b = pick(rng, [-4, -3, -2, -1, 1, 2, 3, 4]);
    const variants = [[k, b], [-k, b], [k, -b], [-k, -b]] as const;
    const labels = shuffle(rng, variants.map(([kk, bb]) => describeLine(kk, bb)));
    return {
      text: `Дана функция ${lin(k, b)}.`,
      question: 'Как выглядит её график?',
      ...labelled(labels, labels.indexOf(describeLine(k, b)) + 1),
      hint: 'Знак k говорит, возрастает ли прямая; b — где она пересекает ось y.',
      steps: [`k = ${k} ${k > 0 ? '> 0 — возрастает' : '< 0 — убывает'}`, `b = ${b} ${b > 0 ? '> 0 — пересекает ось y выше нуля' : '< 0 — ниже нуля'}`],
      wrong: [],
    };
  }),
  T('t11-2-match-lines', t, 2, 'input', (rng) => {
    const combos = shuffle(rng, [[1, 1], [1, -1], [-1, 1], [-1, -1]]).slice(0, 3) as [number, number][];
    const funcs = combos.map(([sk, sb]) => [sk * randInt(rng, 1, 3), sb * randInt(rng, 1, 5)] as const);
    const order = shuffle(rng, [0, 1, 2]);
    const formulas = funcs.map((f, i) => `${i + 1}) ${lin(f[0], f[1])}`).join('; ');
    const answer = order.map((i) => i + 1).join('');
    const curves: Curve[] = order.map((i) => ({ kind: 'line', k: funcs[i]![0], b: funcs[i]![1] }));
    return {
      text: `На рисунках изображены графики функций вида y = kx + b. Функции: ${formulas}.`,
      figure: graphsFigure(curves),
      figureAlt: order.map((i, pos) => `${'АБВ'[pos]}: ${describeLine(funcs[i]![0], funcs[i]![1])}`).join('; '),
      question: 'Установите соответствие между графиками А, Б, В и функциями. В ответ запишите три цифры в порядке А, Б, В.',
      ...digits(answer),
      hint: 'Сравните знак k (возрастает/убывает) и знак b (выше/ниже нуля).',
      steps: order.map((i, pos) => `${'АБВ'[pos]}: ${lin(funcs[i]![0], funcs[i]![1])} — номер ${i + 1}`),
      wrong: [],
    };
  }),
  T('t11-3-match-parabolas', t, 3, 'input', (rng) => {
    const combos = shuffle(rng, [[1, 1], [1, -1], [-1, 1], [-1, -1]]).slice(0, 3) as [number, number][];
    const funcs = combos.map(([sa, sc]) => [sa, randInt(rng, -4, 4), sc * randInt(rng, 1, 5)] as const);
    const order = shuffle(rng, [0, 1, 2]);
    const formulas = funcs.map((f, i) => `${i + 1}) y = ${lead(f[0], 'x²')} ${term(f[1], 'x')} ${term(f[2])}`.replace(/\s+/g, ' ')).join('; ');
    const answer = order.map((i) => i + 1).join('');
    const curves: Curve[] = order.map((i) => ({ kind: 'parabola', a: funcs[i]![0] * 0.5, b: funcs[i]![1] * 0.5, c: funcs[i]![2] }));
    return {
      text: `На рисунках изображены графики функций вида y = ax² + bx + c. Функции: ${formulas}.`,
      figure: graphsFigure(curves),
      figureAlt: order.map((i, pos) => `${'АБВ'[pos]}: ${describeParabola(funcs[i]![0], funcs[i]![2])}`).join('; '),
      question: 'Установите соответствие между графиками А, Б, В и функциями. В ответ запишите три цифры в порядке А, Б, В.',
      ...digits(answer),
      hint: 'Знак a задаёт направление ветвей, c — точку пересечения с осью y.',
      steps: order.map((i, pos) => `${'АБВ'[pos]}: a ${funcs[i]![0] > 0 ? '> 0' : '< 0'}, c ${funcs[i]![2] > 0 ? '> 0' : '< 0'} — номер ${i + 1}`),
      wrong: [],
    };
  }),
  T('t11-2-types', t, 2, 'input', (rng) => {
    const lk = pick(rng, [1, 2, -1, -2]);
    const lb = randInt(rng, -3, 3);
    const pa = pick(rng, [1, -1]);
    const pc = randInt(rng, -3, 3);
    const hk = pick(rng, [1, 2, 3, -1, -2]);
    const kinds = shuffle(rng, [
      { f: `y = ${lead(lk, 'x')} ${term(lb)}`.trim(), d: 'прямая', c: { kind: 'line', k: lk, b: lb } as Curve },
      { f: `y = ${lead(pa, 'x²')} ${term(pc)}`.trim(), d: 'парабола', c: { kind: 'parabola', a: pa * 0.5, b: 0, c: pc } as Curve },
      { f: `y = ${lead(hk)}/x`, d: 'гипербола', c: { kind: 'hyperbola', k: hk * 2 } as Curve },
    ]);
    const order = shuffle(rng, [0, 1, 2]);
    const formulas = kinds.map((k, i) => `${i + 1}) ${k.f}`).join('; ');
    const answer = order.map((i) => i + 1).join('');
    return {
      text: `На рисунках изображены графики функций. Функции: ${formulas}.`,
      figure: graphsFigure(order.map((i) => kinds[i]!.c)),
      figureAlt: order.map((i, pos) => `${'АБВ'[pos]}: ${kinds[i]!.d}`).join('; '),
      question: 'Установите соответствие между графиками и функциями. В ответ запишите три цифры в порядке А, Б, В.',
      ...digits(answer),
      hint: 'y = kx + b — прямая, y = ax² + … — парабола, y = k/x — гипербола.',
      steps: order.map((i, pos) => `${'АБВ'[pos]}: ${kinds[i]!.d} — ${kinds[i]!.f} — номер ${i + 1}`),
      wrong: [],
    };
  }),
];
