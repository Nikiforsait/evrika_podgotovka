// Task 13: inequalities and systems — answers as intervals or integer solutions.
import { pick, randInt, shuffle } from '../../src/lib/rng.ts';
import { hl, labelled, show, term, T, wrong } from '../helpers.ts';
import type { TaskTemplate } from '../types.ts';

const t = 't13';
const INF = '+∞';
const seg = (a: number | string, b: number | string, lo: '[' | '(', hi: ']' | ')') => `${lo}${typeof a === 'number' ? show(a) : a}; ${typeof b === 'number' ? show(b) : b}${hi}`;

export const t13: TaskTemplate[] = [
  T('t13-0-smallest', t, 0, 'input', (rng) => {
    const b = randInt(rng, 1, 9);
    const c = randInt(rng, b + 1, 20);
    return {
      text: `Решите неравенство x + ${hl(b)} > ${hl(c)}.`,
      question: 'Укажите наименьшее целое решение.',
      answer: String(c - b + 1), expr: `${c} - ${b} + 1`,
      hint: 'Перенесите число вправо. Неравенство строгое — граница не входит.',
      steps: [`x > ${c} − ${b} = ${c - b}`, `Наименьшее целое: ${c - b + 1}`],
      wrong: [wrong(c - b, 'rounding', 'Неравенство строгое — само граничное число не подходит.')],
    };
  }),
  T('t13-1-system', t, 1, 'choice', (rng) => {
    const lo = randInt(rng, -4, 5);
    const hi = lo + pick(rng, [0.5, 0.6, 1, 1.5, 2]);
    const shift = randInt(rng, 1, 3);
    const strictHi = rng() < 0.5;
    const correct = seg(lo, hi, '[', strictHi ? ')' : ']');
    const labels = shuffle(rng, [
      correct,
      seg(lo, hi, '(', strictHi ? ']' : ')'),
      seg('−∞', lo, '(', ']'),
      seg(hi, INF, strictHi ? '(' : '[', ')'),
    ]);
    return {
      text: `Укажите решение системы неравенств: x − ${hl(hi)} ${strictHi ? '<' : '≤'} 0 и x − ${hl(shift)} ≥ ${hl(lo - shift)}.`.replace('≥ −', '≥ −'),
      question: 'Выберите верный вариант.',
      ...labelled(labels, labels.indexOf(correct) + 1),
      hint: 'Решите каждое неравенство отдельно, затем найдите общую часть.',
      steps: [`x ${strictHi ? '<' : '≤'} ${show(hi)} и x ≥ ${show(lo)}`, `Общая часть: ${correct} (квадратная скобка — число входит)`],
      wrong: [],
    };
  }),
  T('t13-2-linear', t, 2, 'choice', (rng) => {
    // a − k(x − m) < c − x  ⇔  (1 − k)x < c − a − k·m  ⇔  x > bound (k > 1 flips the sign)
    const k = randInt(rng, 2, 5);
    const m = randInt(rng, 1, 4);
    const bound = randInt(rng, -6, 6);
    const a = randInt(rng, 1, 9);
    const c = a - k * m + (1 - k) * bound; // makes the bound exact
    const strict = rng() < 0.5;
    const correct = seg(bound, INF, strict ? '(' : '[', ')');
    const labels = shuffle(rng, [correct, seg('−∞', bound, '(', strict ? ')' : ']'), seg(-bound, INF, '(', ')'), seg('−∞', -bound, '(', ')')]);
    return {
      text: `Решите неравенство ${hl(a)} − ${hl(k)}(x − ${hl(m)}) ${strict ? '<' : '≤'} ${hl(c)} − x.`,
      question: 'Выберите верный вариант.',
      ...labelled(labels, labels.indexOf(correct) + 1),
      hint: 'Раскройте скобки, соберите x слева. При делении на отрицательное число знак неравенства меняется.',
      steps: [`${a} − ${k}x + ${k * m} ${strict ? '<' : '≤'} ${c} − x`, `${1 - k}x ${strict ? '<' : '≤'} ${c - a - k * m}`, `Делим на ${1 - k} (знак меняется): x ${strict ? '>' : '≥'} ${bound}`],
      wrong: [],
    };
  }),
  T('t13-2-largest', t, 2, 'input', (rng) => {
    const a = randInt(rng, 3, 7);
    const c = randInt(rng, 1, a - 1);
    const bound = randInt(rng, -6, 9);
    const d = randInt(rng, -8, 8);
    const b = (a - c) * bound - d;
    return {
      text: `Решите неравенство ${[`${hl(a)}x`, term(-b)].filter(Boolean).join(' ')} ≤ ${[c === 1 ? 'x' : `${hl(c)}x`, term(d)].filter(Boolean).join(' ')}.`,
      question: 'Укажите наибольшее целое решение.',
      answer: String(bound), expr: `(${b} + (${d})) / (${a} - ${c})`,
      hint: 'Соберите слагаемые с x слева, числа — справа.',
      steps: [`${a}x − ${c}x ≤ ${d} ${term(b)}`, `${a - c}x ≤ ${b + d}`, `x ≤ ${bound}`],
      wrong: [wrong(bound - 1, 'rounding', 'Неравенство нестрогое — граница входит в ответ.'), wrong(bound + 1, 'rounding', 'Число справа от границы уже не подходит.')],
    };
  }),
  T('t13-3-quadratic', t, 3, 'choice', (rng) => {
    const r1 = randInt(rng, -5, 2);
    const r2 = r1 + randInt(rng, 2, 8);
    const less = rng() < 0.5;
    const p = -(r1 + r2);
    const q = r1 * r2;
    const inside = seg(r1, r2, '(', ')');
    const outside = `(−∞; ${show(r1)}) ∪ (${show(r2)}; +∞)`;
    const correct = less ? inside : outside;
    const labels = shuffle(rng, [inside, outside, seg(r1, r2, '[', ']'), `(−∞; ${show(r2)})`]);
    const lhs = ['x²', term(p, 'x'), term(q)].filter(Boolean).join(' ');
    return {
      text: `Решите неравенство ${lhs} ${less ? '<' : '>'} 0.`,
      question: 'Выберите верный вариант.',
      ...labelled(labels, labels.indexOf(correct) + 1),
      hint: 'Найдите корни трёхчлена. Парабола с ветвями вверх отрицательна между корнями и положительна вне их.',
      steps: [`Корни: ${show(r1)} и ${show(r2)}`, `${lhs} = (x ${term(-r1)})(x ${term(-r2)})`, `${less ? 'Меньше нуля между корнями' : 'Больше нуля вне корней'}: ${correct}`],
      wrong: [],
    };
  }),
  T('t13-3-count', t, 3, 'input', (rng) => {
    const r1 = randInt(rng, -6, 2);
    const r2 = r1 + randInt(rng, 3, 9);
    return {
      text: `Сколько целых чисел удовлетворяют неравенству (x ${term(-r1)})(x ${term(-r2)}) < ${hl(0)}?`,
      question: 'Запишите количество.',
      answer: String(r2 - r1 - 1), expr: `${r2} - (${r1}) - 1`,
      hint: 'Произведение отрицательно между корнями. Концы не входят.',
      steps: [`Решение: ${r1} < x < ${r2}`, `Целых чисел: ${r2 - r1 - 1}`],
      wrong: [wrong(r2 - r1 + 1, 'rounding', 'Неравенство строгое — корни не входят.')],
    };
  }),
];
