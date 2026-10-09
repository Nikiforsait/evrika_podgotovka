// Task 7: locating numbers on the number line (fractions, roots, intervals).
import { pick, randInt, shuffle } from '../../src/lib/rng.ts';
import { gcd, hl, hlRaw, labelled, mixed, show, T, wrong, yesNo } from '../helpers.ts';
import { numberLineFigure } from '../figures.ts';
import type { TaskTemplate } from '../types.ts';

const t = 't7';
const between = (a: number) => `${a} и ${a + 1}`;
const improper = (rng: () => number, dLo: number, dHi: number, wLo: number, wHi: number) => {
  const d = randInt(rng, dLo, dHi);
  const whole = randInt(rng, wLo, wHi);
  let rest = randInt(rng, 1, d - 1);
  while (gcd(rest, d) !== 1) rest = randInt(rng, 1, d - 1);
  return { n: whole * d + rest, d, whole };
};

export const t07: TaskTemplate[] = [
  // ---- 7.1 fraction between integers ----
  T('t7-1-whole', t, 0, 'input', (rng) => {
    const { n, d, whole } = improper(rng, 2, 6, 2, 9);
    return {
      text: `Чему равна целая часть дроби ${hlRaw(n, d)}?`,
      question: 'Запишите ответ числом.',
      answer: String(whole), expr: `floor(Rational(${n}, ${d}))`,
      hint: 'Разделите числитель на знаменатель и возьмите целое от деления.',
      steps: [`${n} = ${d} · ${whole} + ${n - whole * d}`, `Целая часть: ${whole}`],
      wrong: [wrong(whole + 1, 'rounding', 'Целая часть — это сколько раз знаменатель целиком помещается в числителе.')],
    };
  }),
  T('t7-1-two', t, 1, 'choice', (rng) => {
    const { n, d, whole } = improper(rng, 2, 5, 3, 8);
    const other = whole + (rng() < 0.5 ? 1 : -1);
    const first = rng() < 0.5;
    return {
      text: `Между какими целыми числами заключена дробь ${hlRaw(n, d)}?`,
      question: 'Выберите верный вариант.',
      ...labelled(first ? [between(whole), between(other)] : [between(other), between(whole)], first ? 1 : 2),
      hint: 'Представьте соседние целые числа дробями с тем же знаменателем.',
      steps: [`${whole} = ${whole * d}/${d}, ${whole + 1} = ${(whole + 1) * d}/${d}`, `${whole * d} < ${n} < ${(whole + 1) * d}, значит дробь между ${whole} и ${whole + 1}`],
      wrong: [],
    };
  }),
  T('t7-1-four', t, 2, 'choice', (rng) => {
    const { n, d, whole } = improper(rng, 3, 9, 3, 10);
    const start = whole - randInt(rng, 0, 3);
    const labels = [0, 1, 2, 3].map((i) => between(start + i));
    return {
      text: `Между какими целыми числами заключена дробь ${hlRaw(n, d)}?`,
      question: 'Выберите верный вариант.',
      ...labelled(labels, whole - start + 1),
      hint: 'Выделите целую часть дроби.',
      steps: [`${n} = ${d} · ${whole} + ${n - whole * d}`, `${n}/${d} = ${whole} ${n - whole * d}/${d}, то есть между ${whole} и ${whole + 1}`],
      wrong: [],
    };
  }),
  T('t7-1-big', t, 3, 'choice', (rng) => {
    const { n, d, whole } = improper(rng, 11, 24, 8, 13);
    const start = whole - randInt(rng, 0, 3);
    return {
      text: `Между какими целыми числами заключена дробь ${hlRaw(n, d)}?`,
      question: 'Выберите верный вариант.',
      ...labelled([0, 1, 2, 3].map((i) => between(start + i)), whole - start + 1),
      hint: 'Выделите целую часть: сколько раз знаменатель помещается в числителе?',
      steps: [`${n} = ${d} · ${whole} + ${n - whole * d}`, `Между ${whole} и ${whole + 1}`],
      wrong: [],
    };
  }),

  // ---- 7.2 square roots between integers ----
  T('t7-2-two', t, 1, 'choice', (rng) => {
    const k = randInt(rng, 2, 9);
    const a = randInt(rng, k * k + 1, (k + 1) ** 2 - 1);
    const other = k + (rng() < 0.5 ? 1 : -1);
    const first = rng() < 0.5;
    return {
      text: `Между какими последовательными целыми числами заключено число √${hl(a)}?`,
      question: 'Выберите верный вариант.',
      ...labelled(first ? [between(k), between(other)] : [between(other), between(k)], first ? 1 : 2),
      hint: 'Возведите числа из вариантов в квадрат.',
      steps: [`${k}² = ${k * k}, ${k + 1}² = ${(k + 1) ** 2}`, `${k * k} < ${a} < ${(k + 1) ** 2}, значит √${a} между ${k} и ${k + 1}`],
      wrong: [],
    };
  }),
  T('t7-2-four', t, 2, 'choice', (rng) => {
    const k = randInt(rng, 3, 10);
    const a = randInt(rng, k * k + 1, (k + 1) ** 2 - 1);
    const start = k - randInt(rng, 0, 3);
    return {
      text: `Между какими целыми числами заключено число √${hl(a)}?`,
      question: 'Выберите верный вариант.',
      ...labelled([0, 1, 2, 3].map((i) => between(start + i)), k - start + 1),
      hint: 'Найдите два соседних точных квадрата, между которыми лежит число под корнем.',
      steps: [`${k}² = ${k * k} < ${a} < ${(k + 1) ** 2} = ${k + 1}²`, `Ответ: между ${k} и ${k + 1}`],
      wrong: [],
    };
  }),
  T('t7-2-decoys', t, 3, 'choice', (rng) => {
    const k = randInt(rng, 3, 9);
    const a = randInt(rng, k * k + 1, (k + 1) ** 2 - 1);
    const decoys = [`${a - 1} и ${a + 1}`, `${Math.floor(a / 2) - 1} и ${Math.floor(a / 2) + 1}`, between(k + (rng() < 0.5 ? 2 : -2))];
    const labels = shuffle(rng, [between(k), ...decoys]);
    return {
      text: `Между какими целыми числами заключено число √${hl(a)}?`,
      question: 'Выберите верный вариант.',
      ...labelled(labels, labels.indexOf(between(k)) + 1),
      hint: 'Корень из числа гораздо меньше самого числа. Сравните квадраты целых чисел с ' + a + '.',
      steps: [`${k}² = ${k * k}, ${k + 1}² = ${(k + 1) ** 2}`, `${k * k} < ${a} < ${(k + 1) ** 2} ⇒ ${k} < √${a} < ${k + 1}`],
      wrong: [],
    };
  }),

  // ---- 7.3 fraction in a segment ----
  T('t7-3-yesno', t, 1, 'choice', (rng) => {
    const { n, d, whole } = improper(rng, 3, 10, 3, 9);
    const yes = rng() < 0.55;
    const lo = yes ? whole : whole + pick(rng, [-1, 1]);
    return {
      text: `Принадлежит ли дробь ${hlRaw(n, d)} отрезку [${lo}; ${lo + 1}]?`,
      question: 'Выберите ответ.',
      ...yesNo(yes),
      hint: 'Представьте концы отрезка дробями со знаменателем ' + d + '.',
      steps: [`${lo} = ${lo * d}/${d}, ${lo + 1} = ${(lo + 1) * d}/${d}`, yes ? `${lo * d} ≤ ${n} ≤ ${(lo + 1) * d} — да` : `${n} не лежит между ${lo * d} и ${(lo + 1) * d} — нет`],
      wrong: [],
    };
  }),
  ...([2, 3] as const).map((level) =>
    T(`t7-3-which-${level}`, t, level, 'choice', (rng) => {
      const d = level === 2 ? randInt(rng, 5, 11) : randInt(rng, 13, 23);
      const lo = randInt(rng, 2, 9);
      const good = lo * d + randInt(rng, 1, d - 1);
      const offsets = shuffle(rng, [-2, -1, 1, 2]).slice(0, 3);
      const bad = offsets.map((o) => (lo + o) * d + randInt(rng, 1, d - 1));
      const labels = shuffle(rng, [good, ...bad]).map((n) => `${n}/${d}`);
      return {
        text: `Какая из дробей принадлежит отрезку [${lo}; ${lo + 1}]?`,
        question: 'Выберите верный вариант.',
        ...labelled(labels, labels.indexOf(`${good}/${d}`) + 1),
        hint: 'Выделите целую часть каждой дроби.',
        steps: [`${good}/${d} = ${mixed(good, d).whole} ${mixed(good, d).rest}/${d} — между ${lo} и ${lo + 1}`, 'У остальных дробей целая часть другая.'],
        wrong: [],
      };
    }),
  ),

  // ---- 7.4 fraction in a decimal interval ----
  T('t7-4-yesno', t, 1, 'choice', (rng) => {
    const fr = pick(rng, [[1, 2], [3, 4], [1, 4], [2, 5], [4, 5], [1, 5], [3, 10], [7, 10], [9, 10], [1, 10]] as const);
    const v = fr[0] / fr[1];
    const yes = rng() < 0.55;
    const lo = yes ? Math.floor(v * 10) / 10 : Math.min(0.8, Math.max(0, Math.floor(v * 10) / 10 + pick(rng, [-0.2, 0.2])));
    const hi = Math.round((lo + 0.2) * 10) / 10;
    const inside = v >= lo && v <= hi;
    return {
      text: `Верно ли, что дробь ${hlRaw(fr[0], fr[1])} принадлежит промежутку от ${hl(lo)} до ${hl(hi)}?`,
      question: 'Выберите ответ.',
      ...yesNo(inside),
      hint: 'Переведите обыкновенную дробь в десятичную.',
      steps: [`${fr[0]}/${fr[1]} = ${show(v)}`, inside ? `${show(lo)} ≤ ${show(v)} ≤ ${show(hi)} — да` : `${show(v)} не лежит между ${show(lo)} и ${show(hi)} — нет`],
      wrong: [],
    };
  }),
  ...([2, 3] as const).map((level) =>
    T(`t7-4-interval-${level}`, t, level, 'choice', (rng) => {
      const d = level === 2 ? pick(rng, [4, 6, 7, 8, 9, 11, 12]) : pick(rng, [13, 17, 18, 19, 23, 26]);
      let n = randInt(rng, 1, d - 1);
      while (gcd(n, d) !== 1 || (n * 10) % d === 0) n = randInt(rng, 1, d - 1);
      const tenth = Math.floor((n * 10) / d); // v ∈ (tenth/10, (tenth+1)/10)
      const start = Math.max(0, Math.min(6, tenth - randInt(rng, 0, 3)));
      const labels = [0, 1, 2, 3].map((i) => `от ${show((start + i) / 10)} до ${show((start + i + 1) / 10)}`);
      return {
        text: `К какому из промежутков принадлежит число ${hlRaw(n, d)}?`,
        question: 'Выберите верный вариант.',
        ...labelled(labels, tenth - start + 1),
        hint: `Приведите дробь и границы к общему знаменателю ${10 * d} или разделите ${n} на ${d}.`,
        steps: [`${n}/${d} = ${n * 10}/${10 * d}; ${show(tenth / 10)} = ${tenth * d}/${10 * d}, ${show((tenth + 1) / 10)} = ${(tenth + 1) * d}/${10 * d}`, `${tenth * d} < ${n * 10} < ${(tenth + 1) * d} ⇒ число между ${show(tenth / 10)} и ${show((tenth + 1) / 10)}`],
        wrong: [],
      };
    }),
  ),

  // ---- 7.5 a number between two fractions ----
  T('t7-5-between', t, 3, 'choice', (rng) => {
    const pairs = [[3, 7, 5, 8], [2, 5, 4, 7], [5, 9, 2, 3], [1, 3, 3, 7], [4, 9, 5, 8], [3, 8, 5, 11], [5, 12, 4, 7], [2, 7, 3, 8]] as const;
    const [a, b, c, d] = pick(rng, pairs);
    const lo = a / b;
    const hi = c / d;
    const mid = Math.round(((lo + hi) / 2) * 100) / 100;
    const decoys = [Math.round((lo - 0.1) * 100) / 100, Math.round((hi + 0.1) * 100) / 100, Math.round((hi + 0.25) * 100) / 100];
    const labels = shuffle(rng, [mid, ...decoys]).map((x) => show(x));
    return {
      text: `Какое из чисел заключено между ${hlRaw(a, b)} и ${hlRaw(c, d)}?`,
      question: 'Выберите верный вариант.',
      ...labelled(labels, labels.indexOf(show(mid)) + 1),
      hint: 'Переведите обе дроби в десятичные (с округлением) и сравните с вариантами.',
      steps: [`${a}/${b} ≈ ${show(Math.round(lo * 100) / 100)}, ${c}/${d} ≈ ${show(Math.round(hi * 100) / 100)}`, `Между ними лежит ${show(mid)}`],
      wrong: [],
    };
  }),

  // ---- 7.6 point on the number line (described in words) ----
  T('t7-6-point', t, 2, 'choice', (rng) => {
    const a = randInt(rng, 1, 7);
    const x = a + pick(rng, [0.3, 0.7]);
    const statements = [`x − ${a} < 0`, `x − ${a + 1} > 0`, `x − ${a + 1} < 0`, `x − ${a + 2} > 0`];
    return {
      text: `На координатной прямой отмечена точка x.`,
      question: 'Какое из утверждений верно для этой точки?',
      figure: numberLineFigure(a - 2, a + 3, x),
      figureAlt: `Координатная прямая, точка x между ${a} и ${a + 1}`,
      ...labelled(statements, 3),
      hint: `Возьмите примерное значение x ≈ ${show(x)} и подставьте в каждое неравенство.`,
      steps: [`x ≈ ${show(x)}: ${show(x)} − ${a + 1} = ${show(Math.round((x - a - 1) * 10) / 10)} < 0`, 'Остальные утверждения при подстановке неверны.'],
      wrong: [],
    };
  }),
];
