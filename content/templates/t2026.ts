// Prototypes matching the 2026 demo version: new sub-types for 7, 8, 9, 10, 13, 15, 16, 17, 18.
// The tyre scenario for tasks 1–5 lives in content/scenarios/tyres.ts.
import { pick, randInt, shuffle } from '../../src/lib/rng.ts';
import { rat } from '../../src/lib/rational.ts';
import { canon, hl, labelled, lead, show, T, term, wrong } from '../helpers.ts';
import { fractionPointFigure, gridCirclesFigure, rightTriangleSides, solutionSetFigure, tangentsFigure, trapezoidDiagonalFigure } from '../figures.ts';
import type { TaskTemplate } from '../types.ts';

const dec = (x: number, digits = 2) => Math.round(x * 10 ** digits) / 10 ** digits;

export const t2026: TaskTemplate[] = [
  // ---- 7: which fraction is marked ----
  T('t7-7-marked-point', 't7', 3, 'choice', (rng) => {
    const d = pick(rng, [6, 7, 8, 9]);
    const nums = shuffle(rng, Array.from({ length: 2 * d - 1 }, (_, i) => i + 1).filter((n) => n % d !== 0)).slice(0, 4).sort((a, b) => a - b);
    const target = pick(rng, nums);
    const labels = nums.map((n) => `${n}/${d}`);
    return {
      text: `Одно из чисел ${labels.join('; ')} отмечено на числовой прямой точкой A.`,
      question: 'Какое это число?',
      figure: fractionPointFigure(target / d, 2),
      figureAlt: `Числовая прямая от 0 до 2 с делениями по 0,1; точка A около ${show(dec(target / d, 2))}`,
      ...labelled(labels, nums.indexOf(target) + 1),
      hint: 'Переведите каждую дробь в десятичную и сравните с положением точки.',
      steps: nums.map((n) => `${n}/${d} ≈ ${show(dec(n / d, 2))}`).concat([`Точке A соответствует ${target}/${d}`]),
      wrong: [],
    };
  }),

  // ---- 8: rationalising ----
  T('t8-7-rationalise', 't8', 3, 'input', (rng) => {
    const pairs = [[2, 3], [3, 5], [3, 7], [5, 5], [4, 6], [2, 2], [3, 1], [5, 15], [4, 11], [6, 11]] as const;
    const [a, b] = pick(rng, pairs);
    const res = rat(2 * a, a * a - b);
    return {
      text: `Найдите значение выражения 1/(${hl(a)} + √${hl(b)}) + 1/(${hl(a)} − √${hl(b)}).`,
      question: 'Запишите ответ числом.',
      answer: canon(res), expr: `1/(${a} + sqrt(${b})) + 1/(${a} - sqrt(${b}))`,
      hint: 'Приведите дроби к общему знаменателю: (a + √b)(a − √b) = a² − b.',
      steps: [`Общий знаменатель: (${a} + √${b})(${a} − √${b}) = ${a}² − ${b} = ${a * a - b}`, `Числитель: (${a} − √${b}) + (${a} + √${b}) = ${2 * a}`, `${2 * a} / ${a * a - b} = ${show(res)}`],
      wrong: [wrong(rat(2 * a, a * a + b), 'sign', 'Произведение сопряжённых равно a² − b, а не a² + b.')],
    };
  }),

  // ---- 9: non-monic quadratic ----
  T('t9-6-nonmonic', 't9', 3, 'input', (rng) => {
    const k = pick(rng, [2, 4, 5]);
    const m = randInt(rng, 1, 7);
    const n = randInt(rng, -4, 4) || 1;
    // (kx − m)(x − n) = kx² − (kn + m)x + mn
    if (m === k * n || k * n + m === 0) throw new Error('retry');
    const r1 = rat(m, k);
    const r2 = rat(n);
    const smaller = rng() < 0.5;
    const ans = (r1.n / r1.d < n ? [r1, r2] : [r2, r1])[smaller ? 0 : 1]!;
    const bCoef = -(k * n + m);
    const cCoef = m * n;
    return {
      text: `Решите уравнение ${lead(k, 'x²')} ${term(bCoef, 'x')} ${term(cCoef)} = 0.`,
      question: `Если уравнение имеет более одного корня, в ответ запишите ${smaller ? 'меньший' : 'больший'} из корней.`,
      answer: canon(ans), expr: `${smaller ? 'Min' : 'Max'}(Rational(${m}, ${k}), ${n})`,
      hint: 'Найдите дискриминант D = b² − 4ac и корни x = (−b ± √D) / (2a).',
      steps: [`D = ${bCoef}² − 4 · ${k} · ${cCoef} = ${bCoef * bCoef - 4 * k * cCoef}`, `x₁ = ${show(r1)}, x₂ = ${show(r2)}`, `${smaller ? 'Меньший' : 'Больший'}: ${show(ans)}`],
      wrong: [wrong(smaller ? (r1.n / r1.d < n ? r2 : r1) : (r1.n / r1.d < n ? r1 : r2), 'sign', 'Перепутаны меньший и больший корни.')],
    };
  }),

  // ---- 10: sum in a set ----
  T('t10-4-sum-set', 't10', 3, 'input', (rng) => {
    const start = randInt(rng, 2, 9);
    const sums = [start, start + 1, start + 2];
    const ways = sums.reduce((s, v) => s + (6 - Math.abs(7 - v)), 0);
    const res = rat(ways, 36);
    return {
      text: 'Симметричный игральный кубик бросают два раза.',
      question: `Найдите вероятность события «сумма выпавших очков равна ${sums[0]}, ${sums[1]} или ${sums[2]}».`,
      answer: canon(res), expr: `Rational(${ways}, 36)`,
      hint: 'Посчитайте число пар для каждой суммы и сложите; всего исходов 36.',
      steps: [sums.map((v) => `сумма ${v}: ${6 - Math.abs(7 - v)} пар`).join(', '), `P = ${ways} / 36 = ${show(res)}`],
      wrong: [wrong(rat(ways, 12), 'wrongFormula', 'Всего исходов 6 · 6 = 36.')],
    };
  }),

  // ---- 13: inequality from a picture ----
  T('t13-4-from-figure', 't13', 3, 'choice', (rng) => {
    const b = randInt(rng, 3, 9);
    const inside = rng() < 0.5;
    const labels = [`x² − ${b}x < 0`, `x² − ${b * b} > 0`, `x² − ${b}x > 0`, `x² − ${b * b} < 0`];
    const correct = inside ? 1 : 3;
    return {
      text: 'Укажите неравенство, решение которого изображено на рисунке.',
      question: 'Выберите верный вариант.',
      figure: solutionSetFigure(0, b, inside),
      figureAlt: inside ? `Числовая прямая, заштрихован промежуток от 0 до ${b}, концы не включены` : `Числовая прямая, заштриховано всё левее 0 и правее ${b}, концы не включены`,
      ...labelled(labels, correct),
      hint: `Корни ${inside ? 'x² − bx' : 'x² − bx'}: 0 и ${b}; корни x² − ${b * b}: −${b} и ${b}. Сравните с концами на рисунке.`,
      steps: [`На рисунке концы промежутка 0 и ${b}, значит трёхчлен x(x − ${b}) = x² − ${b}x`, inside ? 'Между корнями парабола с ветвями вверх отрицательна: x² − bx < 0' : 'Вне корней парабола положительна: x² − bx > 0'],
      wrong: [],
    };
  }),

  // ---- 15: trigonometry in a right triangle ----
  T('t15-4-trig', 't15', 3, 'input', (rng) => {
    const [p, q] = pick(rng, [[3, 7], [2, 5], [4, 9], [5, 8], [3, 8], [5, 11], [4, 7]] as const);
    const k = randInt(rng, 2, 6);
    const AB = q * k;
    const AC = p * k;
    return {
      text: `В треугольнике ABC угол C равен 90°, sin B = ${`[[${p}/${q}]]`}, AB = ${hl(AB)}.`,
      question: 'Найдите AC.',
      figure: rightTriangleSides({ AB: String(AB), AC: '?' }, 'B'),
      figureAlt: `Прямоугольный треугольник ABC с прямым углом C, гипотенуза AB = ${AB}`,
      answer: String(AC), expr: `${AB} * ${p} / ${q}`,
      hint: 'Синус угла B — отношение противолежащего катета AC к гипотенузе AB.',
      steps: [`sin B = AC / AB ⇒ AC = AB · sin B`, `AC = ${AB} · ${p}/${q} = ${AC}`],
      wrong: [wrong(rat(AB * q, p), 'wrongFormula', 'Катет = гипотенуза · sin, а не гипотенуза : sin.')],
    };
  }),

  // ---- 16: tangents ----
  T('t16-4-tangents', 't16', 3, 'input', (rng) => {
    const phi = randInt(rng, 20, 70) * 2;
    return {
      text: `Касательные в точках A и B к окружности с центром O пересекаются под углом ${hl(phi)}°.`,
      question: 'Найдите угол ABO. Ответ дайте в градусах.',
      figure: tangentsFigure(`${phi}°`),
      figureAlt: `Окружность с центром O, касательные из точки C касаются её в точках A и B, угол ACB = ${phi}°`,
      answer: String(phi / 2), expr: `${phi} / 2`, unit: '°',
      hint: 'Радиусы OA и OB перпендикулярны касательным, поэтому ∠AOB = 180° − угол между касательными; треугольник AOB равнобедренный.',
      steps: [`∠AOB = 180° − ${phi}° = ${180 - phi}°`, `OA = OB ⇒ ∠ABO = (180° − ${180 - phi}°) / 2 = ${phi / 2}°`],
      wrong: [wrong(180 - phi, 'wrongFormula', 'Это центральный угол AOB, а нужен угол при основании равнобедренного треугольника AOB.')],
    };
  }),

  // ---- 17: isosceles trapezoid height from a 45° diagonal ----
  T('t17-4-trapezoid-diagonal', 't17', 3, 'input', (rng) => {
    const a = randInt(rng, 1, 6);
    const b = a + randInt(rng, 1, 7);
    const h = rat(a + b, 2);
    return {
      text: `Диагональ равнобедренной трапеции образует с её основанием угол 45°. Основания трапеции равны ${hl(a)} и ${hl(b)}.`,
      question: 'Найдите длину высоты трапеции.',
      figure: trapezoidDiagonalFigure(String(a), String(b), '45°'),
      figureAlt: `Равнобедренная трапеция с основаниями ${a} (верхнее) и ${b} (нижнее), диагональ образует с нижним основанием угол 45°`,
      answer: canon(h), expr: `Rational(${a + b}, 2)`,
      hint: 'Опустите высоту из вершины верхнего основания: отрезок от её основания до дальней вершины равен полусумме оснований, а угол 45° делает высоту равной этому отрезку.',
      steps: [`Отрезок под диагональю: (${a} + ${b}) / 2 = ${show(h)}`, `Угол 45° ⇒ высота равна этому отрезку: ${show(h)}`],
      wrong: [wrong(rat(b - a, 2), 'wrongFormula', 'Полуразность оснований — это отрезок у боковой стороны, а не под диагональю.')],
    };
  }),

  // ---- 18: two circles on grid paper ----
  T('t18-4-circles', 't18', 3, 'input', (rng) => {
    const pairs = [[1, 2], [1, 4], [2, 4], [1, 5], [2, 5], [4, 5], [2, 8], [5, 10], [4, 9], [1, 9]] as const;
    const [r1sq, r2sq] = pick(rng, pairs);
    const res = rat(r2sq, r1sq);
    return {
      text: 'На клетчатой бумаге изображены два круга.',
      question: 'Во сколько раз площадь большего круга больше площади меньшего?',
      figure: gridCirclesFigure(r1sq, r2sq),
      figureAlt: `Два круга на клетчатой бумаге: квадрат радиуса меньшего ${r1sq}, большего ${r2sq} клеток`,
      answer: canon(res), expr: `Rational(${r2sq}, ${r1sq})`,
      hint: 'Площадь круга пропорциональна квадрату радиуса. Квадрат радиуса найдите по теореме Пифагора по клеткам.',
      steps: [`r₁² = ${r1sq}, r₂² = ${r2sq} (по клеткам)`, `S₂ / S₁ = r₂² / r₁² = ${show(res)}`],
      wrong: [wrong(rat(Math.round(Math.sqrt(r2sq) * 100), Math.round(Math.sqrt(r1sq) * 100)), 'wrongFormula', 'Отношение площадей равно квадрату отношения радиусов.')],
    };
  }),
];
