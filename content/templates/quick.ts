// Short starting diagnostic: basic multiple-choice tasks (level 2), one per screen.
// Tagged 'quick' so they never appear in training, duels or the full diagnostic.
import { pick, randInt } from '../../src/lib/rng.ts';
import { rat } from '../../src/lib/rational.ts';
import { gridFigure, triangleFigure } from '../figures.ts';
import { canon, hl, hlRaw, show, T, wrong } from '../helpers.ts';
import type { TaskDraft, TaskTemplate } from '../types.ts';

const Q = (id: string, topicId: string, generate: (rng: () => number) => TaskDraft): TaskTemplate => ({
  ...T(id, topicId, 2, 'choice', generate),
  tag: 'quick',
});

export const quick: TaskTemplate[] = [
  // Algebra 1: fractions with different denominators
  Q('quick-alg-fraction', 't6', (rng) => {
    const [p, q] = pick(rng, [[2, 3], [3, 4], [4, 5], [2, 5], [3, 5], [5, 6], [4, 9]] as const);
    const a = randInt(rng, 1, p - 1);
    const c = randInt(rng, 1, q - 1);
    const minus = rng() < 0.4;
    const res = minus ? rat(a * q - c * p, p * q) : rat(a * q + c * p, p * q);
    if (res.n === 0 || res.d === 1) throw new Error('retry');
    const lcm = p * q;
    return {
      text: `Найдите значение выражения ${hlRaw(a, p)} ${minus ? '−' : '+'} ${hlRaw(c, q)}.`,
      question: 'Выберите верный ответ.',
      answer: canon(res),
      expr: `Rational(${a}, ${p}) ${minus ? '-' : '+'} Rational(${c}, ${q})`,
      display: 'fraction',
      hint: `Приведите дроби к общему знаменателю ${lcm}.`,
      steps: [`${a}/${p} = ${a * q}/${lcm}, ${c}/${q} = ${c * p}/${lcm}`, `${a * q}/${lcm} ${minus ? '−' : '+'} ${c * p}/${lcm} = ${res.n}/${res.d}`],
      wrong: [wrong(rat(minus ? a - c : a + c, p + q), 'wrongFormula', 'Числители и знаменатели нельзя складывать по отдельности.'), wrong(rat(minus ? a - c : a + c, lcm), 'wrongFormula', 'Числители надо домножить на дополнительные множители.')],
    };
  }),

  // Algebra 2: linear equation with x on both sides
  Q('quick-alg-equation', 't9', (rng) => {
    const a = pick(rng, [3, 4, 5, 6, 7]);
    const c = pick(rng, [1, 2, 3]);
    if (a === c) throw new Error('retry');
    const x = pick(rng, [-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]);
    const b = randInt(rng, -9, 9);
    const d = (a - c) * x + b; // ax + b = cx + d
    const t = (k: number) => (k === 0 ? '' : k > 0 ? ` + ${k}` : ` − ${-k}`);
    return {
      text: `Решите уравнение ${hl(a)}x${t(b)} = ${c === 1 ? '' : hl(c)}x${t(d)}.`,
      question: 'Выберите верный корень.',
      answer: String(x),
      expr: `(${d} - (${b})) / (${a} - ${c})`,
      hint: 'Соберите x в левой части, числа в правой, затем разделите.',
      steps: [`${a}x − ${c}x = ${d} − (${b})`, `${a - c}x = ${d - b}`, `x = ${x}`],
      wrong: [wrong(-x, 'sign', 'Потерян знак при переносе.'), wrong(rat(d - b, a + c), 'wrongFormula', 'При переносе cx в левую часть коэффициенты вычитаются, а не складываются.')],
    };
  }),

  // Geometry 1: isosceles triangle, apex angle from a base angle
  Q('quick-geo-angle', 't15', (rng) => {
    const A = randInt(rng, 5, 16) * 5; // base angle
    const B = 180 - 2 * A;
    if (B === A) throw new Error('retry');
    return {
      text: `В равнобедренном треугольнике ABC с основанием AC угол A равен ${hl(A)}°.`,
      question: 'Найдите угол B.',
      figure: triangleFigure({ equalSides: 'AB=BC', angles: { A: `${A}°`, B: '?' } }),
      figureAlt: `Равнобедренный треугольник ABC, AB = BC, угол при основании A равен ${A}°`,
      answer: String(B),
      expr: `180 - 2 * ${A}`,
      unit: '°',
      hint: 'Углы при основании равнобедренного треугольника равны, а сумма углов равна 180°.',
      steps: [`∠C = ∠A = ${A}°`, `∠B = 180° − ${A}° − ${A}° = ${B}°`],
      wrong: [wrong(180 - A, 'wrongFormula', 'Вычли только один угол при основании.'), wrong(A, 'wrongFormula', 'Угол при вершине не равен углу при основании.')],
    };
  }),

  // Geometry 2: area of a right triangle on grid paper
  Q('quick-geo-grid', 't18', (rng) => {
    const w = randInt(rng, 3, 9);
    const h = randInt(rng, 2, 7);
    if ((w * h) % 2 !== 0 || w === h) throw new Error('retry');
    const x0 = randInt(rng, 1, 10 - w);
    const y0 = randInt(rng, 1, 10 - h);
    return {
      text: `На клетчатой бумаге с размером клетки 1 см × 1 см изображён прямоугольный треугольник с катетами ${hl(w)} см и ${hl(h)} см.`,
      question: 'Найдите его площадь. Ответ дайте в квадратных сантиметрах.',
      figure: gridFigure([[x0, y0], [x0 + w, y0], [x0, y0 + h]]),
      figureAlt: `Прямоугольный треугольник с катетами ${w} и ${h} клеток`,
      answer: String((w * h) / 2),
      expr: `${w} * ${h} / 2`,
      unit: 'см²',
      hint: 'Площадь прямоугольного треугольника — половина произведения катетов.',
      steps: [`S = ${w} · ${h} : 2 = ${(w * h) / 2} см²`],
      wrong: [wrong(w * h, 'wrongFormula', 'Это площадь прямоугольника; у треугольника она вдвое меньше.'), wrong(w + h, 'wrongFormula', 'Катеты перемножают, а не складывают.')],
    };
  }),
];

// Mixed block, question 1: arithmetic progression (standalone)
export const quickMixed: TaskTemplate[] = [
  Q('quick-progression', 't14', (rng) => {
    const a1 = randInt(rng, 1, 9);
    const d = randInt(rng, 2, 6);
    const terms = Array.from({ length: 4 }, (_, i) => a1 + i * d);
    const next = a1 + 4 * d;
    return {
      text: `Дана арифметическая прогрессия: ${terms.map((t) => hl(t)).join(', ')}, …`,
      question: 'Найдите её пятый член.',
      answer: String(next),
      expr: `${a1} + 4 * ${d}`,
      hint: `Каждый следующий член больше предыдущего на ${d}.`,
      steps: [`Разность: ${terms[1]} − ${terms[0]} = ${d}`, `Пятый член: ${terms[3]} + ${d} = ${next}`],
      wrong: [wrong(next + d, 'wrongFormula', 'Прибавили разность дважды.'), wrong(terms[3]! * 2, 'wrongFormula', 'Члены прогрессии не удваиваются, а растут на одну и ту же разность.')],
    };
  }),
  // Mixed block, question 2: classical probability (standalone)
  Q('quick-probability', 't10', (rng) => {
    const total = pick(rng, [5, 10, 20, 25]);
    const red = randInt(rng, 1, total - 1);
    const prob = rat(red, total);
    const item = pick(rng, ['шаров', 'карточек', 'конфет', 'билетов'] as const);
    const colour = item === 'шаров' ? 'красных' : item === 'карточек' ? 'выигрышных' : item === 'конфет' ? 'шоколадных' : 'счастливых';
    return {
      text: `В коробке ${hl(total)} ${item}, из них ${hl(red)} ${colour}.`,
      question: `Какова вероятность того, что наугад взятый предмет окажется из числа ${colour}?`,
      answer: canon(prob),
      expr: `Rational(${red}, ${total})`,
      hint: 'Вероятность = число подходящих исходов : число всех исходов.',
      steps: [`P = ${red} / ${total} = ${show(prob)}`],
      wrong: [wrong(rat(total - red, total), 'wrongFormula', 'Это вероятность противоположного события.'), wrong(rat(red, total - red), 'wrongFormula', 'Делить нужно на число всех предметов, а не на число остальных.')],
    };
  }),
];
