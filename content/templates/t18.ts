// Task 18: areas of figures on grid paper, given by vertex coordinates.
import { randInt } from '../../src/lib/rng.ts';
import { canon, hl, show, T, wrong } from '../helpers.ts';
import { gridFigure, type Pt } from '../figures.ts';
import type { TaskTemplate } from '../types.ts';

const t = 't18';
const INTRO = 'На клетчатой бумаге с размером клетки 1 см × 1 см отмечены вершины фигуры.';
const pts = (list: [number, number][]) => list.map(([x, y]) => `(${x}; ${y})`).join(', ');

export const t18: TaskTemplate[] = [
  T('t18-0-rectangle-sides', t, 0, 'input', (rng) => {
    const a = randInt(rng, 2, 9);
    const b = randInt(rng, 2, 9);
    return {
      text: `На клетчатой бумаге с размером клетки 1 см × 1 см изображён прямоугольник ${hl(a)} на ${hl(b)} клеток.`,
      question: 'Найдите его площадь. Ответ дайте в квадратных сантиметрах.',
      figure: gridFigure([[1, 1], [1 + a, 1], [1 + a, 1 + b], [1, 1 + b]] as Pt[], 11),
      figureAlt: `Прямоугольник ${a} на ${b} клеток`,
      answer: String(a * b), expr: `${a} * ${b}`, unit: 'см²',
      hint: 'Площадь прямоугольника — произведение сторон.',
      steps: [`S = ${a} · ${b} = ${a * b} см²`],
      wrong: [wrong(2 * (a + b), 'wrongFormula', 'Это периметр, а не площадь.')],
    };
  }),
  T('t18-1-rectangle', t, 1, 'input', (rng) => {
    const x0 = randInt(rng, 0, 3);
    const y0 = randInt(rng, 0, 3);
    const a = randInt(rng, 2, 8);
    const b = randInt(rng, 2, 6);
    return {
      text: `${INTRO} Прямоугольник с вершинами ${pts([[x0, y0], [x0 + a, y0], [x0 + a, y0 + b], [x0, y0 + b]])}.`,
      question: 'Найдите его площадь. Ответ дайте в квадратных сантиметрах.',
      figure: gridFigure([[x0, y0], [x0 + a, y0], [x0 + a, y0 + b], [x0, y0 + b]] as Pt[], 12),
      figureAlt: 'Прямоугольник на клетчатой бумаге',
      answer: String(a * b), expr: `${a} * ${b}`, unit: 'см²',
      hint: 'Длины сторон — разности координат вершин.',
      steps: [`Стороны: ${x0 + a} − ${x0} = ${a} и ${y0 + b} − ${y0} = ${b}`, `S = ${a} · ${b} = ${a * b} см²`],
      wrong: [wrong((x0 + a) * (y0 + b), 'wrongFormula', 'Нужны длины сторон, а не координаты дальней вершины.')],
    };
  }),
  T('t18-2-triangle', t, 2, 'input', (rng) => {
    const x0 = randInt(rng, 0, 2);
    const y0 = randInt(rng, 0, 2);
    const a = randInt(rng, 3, 9);
    const h = randInt(rng, 2, 7);
    const shift = randInt(rng, 0, a);
    const area = (a * h) / 2;
    return {
      text: `${INTRO} Треугольник с вершинами ${pts([[x0, y0], [x0 + a, y0], [x0 + shift, y0 + h]])}.`,
      question: 'Найдите его площадь. Ответ дайте в квадратных сантиметрах.',
      figure: gridFigure([[x0, y0], [x0 + a, y0], [x0 + shift, y0 + h]] as Pt[], 12),
      figureAlt: 'Треугольник на клетчатой бумаге',
      answer: canon(area), expr: `${a} * ${h} / 2`, unit: 'см²',
      hint: 'Одна сторона лежит горизонтально — это основание; высота — разность координат y.',
      steps: [`Основание: ${a}, высота: ${h}`, `S = ½ · ${a} · ${h} = ${show(area)} см²`],
      wrong: [wrong(a * h, 'wrongFormula', 'Площадь треугольника — половина произведения основания на высоту.')],
    };
  }),
  T('t18-2-parallelogram', t, 2, 'input', (rng) => {
    const x0 = randInt(rng, 0, 2);
    const y0 = randInt(rng, 0, 2);
    const a = randInt(rng, 3, 8);
    const h = randInt(rng, 2, 6);
    const shift = randInt(rng, 1, 4);
    return {
      text: `${INTRO} Параллелограмм с вершинами ${pts([[x0, y0], [x0 + a, y0], [x0 + a + shift, y0 + h], [x0 + shift, y0 + h]])}.`,
      question: 'Найдите его площадь. Ответ дайте в квадратных сантиметрах.',
      figure: gridFigure([[x0, y0], [x0 + a, y0], [x0 + a + shift, y0 + h], [x0 + shift, y0 + h]] as Pt[], 14),
      figureAlt: 'Параллелограмм на клетчатой бумаге',
      answer: String(a * h), expr: `${a} * ${h}`, unit: 'см²',
      hint: 'Площадь параллелограмма — основание на высоту; наклон не влияет на площадь.',
      steps: [`Основание: ${a}, высота: ${h}`, `S = ${a} · ${h} = ${a * h} см²`],
      wrong: [wrong((a + shift) * h, 'wrongFormula', 'Основание — горизонтальная сторона, без учёта сдвига.')],
    };
  }),
  T('t18-3-trapezoid', t, 3, 'input', (rng) => {
    const x0 = randInt(rng, 0, 2);
    const y0 = randInt(rng, 0, 2);
    const a = randInt(rng, 6, 12);
    const b = randInt(rng, 2, a - 2);
    const h = randInt(rng, 2, 6);
    const shift = randInt(rng, 0, a - b);
    const area = ((a + b) * h) / 2;
    return {
      text: `${INTRO} Трапеция с вершинами ${pts([[x0, y0], [x0 + a, y0], [x0 + shift + b, y0 + h], [x0 + shift, y0 + h]])}.`,
      question: 'Найдите её площадь. Ответ дайте в квадратных сантиметрах.',
      figure: gridFigure([[x0, y0], [x0 + a, y0], [x0 + shift + b, y0 + h], [x0 + shift, y0 + h]] as Pt[], 14),
      figureAlt: 'Трапеция на клетчатой бумаге',
      answer: canon(area), expr: `(${a} + ${b}) * ${h} / 2`, unit: 'см²',
      hint: 'Площадь трапеции: полусумма оснований на высоту.',
      steps: [`Основания: ${a} и ${b}, высота: ${h}`, `S = (${a} + ${b}) / 2 · ${h} = ${show(area)} см²`],
      wrong: [wrong((a + b) * h, 'wrongFormula', 'Сумму оснований нужно разделить на 2.'), wrong(a * h, 'wrongFormula', 'Учтены не оба основания.')],
    };
  }),
  T('t18-3-rhombus-diagonals', t, 3, 'input', (rng) => {
    const cx = randInt(rng, 4, 7);
    const cy = randInt(rng, 3, 6);
    const p = randInt(rng, 2, 4);
    const q = randInt(rng, 1, 3);
    const d1 = 2 * p;
    const d2 = 2 * q;
    return {
      text: `${INTRO} Ромб с вершинами ${pts([[cx - p, cy], [cx, cy - q], [cx + p, cy], [cx, cy + q]])}.`,
      question: 'Найдите его площадь. Ответ дайте в квадратных сантиметрах.',
      figure: gridFigure([[cx - p, cy], [cx, cy - q], [cx + p, cy], [cx, cy + q]] as Pt[], 12),
      figureAlt: 'Ромб на клетчатой бумаге',
      answer: String((d1 * d2) / 2), expr: `${d1} * ${d2} / 2`, unit: 'см²',
      hint: 'Площадь ромба — половина произведения диагоналей.',
      steps: [`Диагонали: ${d1} и ${d2}`, `S = ½ · ${d1} · ${d2} = ${(d1 * d2) / 2} см²`],
      wrong: [wrong(d1 * d2, 'wrongFormula', 'Произведение диагоналей нужно разделить на 2.')],
    };
  }),
  T('t18-3-l-shape', t, 3, 'input', (rng) => {
    const a = randInt(rng, 5, 9);
    const b = randInt(rng, 4, 7);
    const cut = randInt(rng, 1, a - 2);
    const cutH = randInt(rng, 1, b - 2);
    const area = a * b - cut * cutH;
    return {
      text: `${INTRO} Фигура получена из прямоугольника ${hl(a)}×${hl(b)} клеток вырезанием из угла прямоугольника ${hl(cut)}×${hl(cutH)} клеток.`,
      question: 'Найдите площадь фигуры. Ответ дайте в квадратных сантиметрах.',
      figure: gridFigure([[1, 1], [1 + a, 1], [1 + a, 1 + b - cutH], [1 + a - cut, 1 + b - cutH], [1 + a - cut, 1 + b], [1, 1 + b]] as Pt[], 11),
      figureAlt: `Фигура из прямоугольника ${a}×${b} с вырезанным углом ${cut}×${cutH}`,
      answer: String(area), expr: `${a} * ${b} - ${cut} * ${cutH}`, unit: 'см²',
      hint: 'Из площади большого прямоугольника вычтите площадь вырезанного.',
      steps: [`${a} · ${b} = ${a * b}; ${cut} · ${cutH} = ${cut * cutH}`, `S = ${a * b} − ${cut * cutH} = ${area} см²`],
      wrong: [wrong(a * b, 'wrongFormula', 'Вырезанную часть нужно вычесть.')],
    };
  }),
];
