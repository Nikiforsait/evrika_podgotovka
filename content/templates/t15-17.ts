// Tasks 15–17: triangles, circles, quadrilaterals (angles and lengths).
import { randInt } from '../../src/lib/rng.ts';
import { hl, T, wrong } from '../helpers.ts';
import { circleFigure, quadFigure, rightTriangleFigure, triangleFigure } from '../figures.ts';
import type { TaskTemplate } from '../types.ts';

const deg = '°';

export const t1517: TaskTemplate[] = [
  // ---- Task 15: triangles ----
  T('t15-0-third-angle', 't15', 0, 'input', (rng) => {
    const a = randInt(rng, 25, 80);
    const b = randInt(rng, 25, 170 - a);
    return {
      text: `В треугольнике ABC угол A равен ${hl(a)}${deg}, угол C равен ${hl(b)}${deg}.`,
      question: 'Найдите угол B. Ответ дайте в градусах.',
      figure: triangleFigure({ apex: 180 - a - b, angles: { A: `${a}°`, C: `${b}°` } }),
      figureAlt: `Треугольник ABC, отмечены углы A = ${a}° и C = ${b}°`,
      answer: String(180 - a - b), expr: `180 - ${a} - ${b}`, unit: deg,
      hint: 'Сумма углов треугольника равна 180°.',
      steps: [`180° − ${a}° − ${b}° = ${180 - a - b}°`],
      wrong: [wrong(360 - a - b, 'wrongFormula', 'Сумма углов треугольника — 180°, а не 360°.')],
    };
  }),
  T('t15-1-isosceles-apex', 't15', 1, 'input', (rng) => {
    const apex = randInt(rng, 20, 80) * 2; // even, so base angles are integers
    return {
      text: `В треугольнике ABC известно, что AB = BC, ∠ABC = ${hl(apex)}${deg}.`,
      question: 'Найдите угол BCA. Ответ дайте в градусах.',
      figure: triangleFigure({ apex, equalSides: 'AB=BC', angles: { B: `${apex}°` } }),
      figureAlt: `Равнобедренный треугольник ABC с равными сторонами AB и BC, угол B = ${apex}°`,
      answer: String((180 - apex) / 2), expr: `(180 - ${apex}) / 2`, unit: deg,
      hint: 'Углы при основании равнобедренного треугольника равны.',
      steps: [`∠BAC + ∠BCA = 180° − ${apex}° = ${180 - apex}°`, `∠BCA = ${180 - apex}° : 2 = ${(180 - apex) / 2}°`],
      wrong: [wrong(180 - apex, 'wrongFormula', 'Это сумма двух углов при основании, а не один из них.')],
    };
  }),
  T('t15-2-exterior', 't15', 2, 'input', (rng) => {
    const c = randInt(rng, 35, 150);
    return {
      text: `В треугольнике ABC угол C равен ${hl(c)}${deg}.`,
      question: 'Найдите внешний угол при вершине C. Ответ дайте в градусах.',
      figure: triangleFigure({ apex: 60, angles: { C: `${c}°` }, exteriorAt: 'C', exteriorText: '?' }),
      figureAlt: `Треугольник ABC, угол C = ${c}°, при вершине C отмечен внешний угол`,
      answer: String(180 - c), expr: `180 - ${c}`, unit: deg,
      hint: 'Внешний угол и внутренний угол при той же вершине — смежные, их сумма 180°.',
      steps: [`180° − ${c}° = ${180 - c}°`],
      wrong: [wrong(360 - c, 'wrongFormula', 'Смежные углы в сумме дают 180°.')],
    };
  }),
  T('t15-3-isosceles-exterior', 't15', 3, 'input', (rng) => {
    const base = randInt(rng, 46, 80); // base angle
    const ext = 180 - base;
    return {
      text: `В равнобедренном треугольнике ABC с основанием AC внешний угол при вершине C равен ${hl(ext)}${deg}.`,
      question: 'Найдите угол ABC. Ответ дайте в градусах.',
      figure: triangleFigure({ apex: 180 - 2 * base, equalSides: 'AB=BC', exteriorAt: 'C', exteriorText: `${ext}°` }),
      figureAlt: `Равнобедренный треугольник ABC с основанием AC, внешний угол при C = ${ext}°`,
      answer: String(180 - 2 * base), expr: `180 - 2 * (180 - ${ext})`, unit: deg,
      hint: 'Найдите угол C через смежный, затем используйте равенство углов при основании.',
      steps: [`∠C = 180° − ${ext}° = ${base}°`, `∠A = ∠C = ${base}°`, `∠ABC = 180° − 2 · ${base}° = ${180 - 2 * base}°`],
      wrong: [wrong(base, 'wrongFormula', 'Найден угол при основании, а нужен угол при вершине B.')],
    };
  }),
  T('t15-3-right', 't15', 3, 'input', (rng) => {
    const a = randInt(rng, 15, 75);
    return {
      text: `В прямоугольном треугольнике один из острых углов равен ${hl(a)}${deg}. Биссектриса прямого угла делит его пополам.`,
      question: 'Найдите больший угол между биссектрисой прямого угла и гипотенузой. Ответ дайте в градусах.',
      figure: rightTriangleFigure(`${a}°`),
      figureAlt: `Прямоугольный треугольник ABC с прямым углом C, угол A = ${a}°`,
      answer: String(180 - 45 - Math.min(a, 90 - a)), expr: `180 - 45 - ${Math.min(a, 90 - a)}`, unit: deg,
      hint: 'Биссектриса делит прямой угол на два по 45°. Рассмотрите треугольник с меньшим острым углом.',
      steps: [`Острые углы: ${a}° и ${90 - a}°`, `В треугольнике с углом ${Math.min(a, 90 - a)}° и углом 45°: третий угол 180° − 45° − ${Math.min(a, 90 - a)}° = ${135 - Math.min(a, 90 - a)}°`],
      wrong: [wrong(135 - Math.max(a, 90 - a), 'wrongFormula', 'Это меньший из двух углов между биссектрисой и гипотенузой.')],
    };
  }),

  // ---- Task 16: circles ----
  T('t16-0-inscribed', 't16', 0, 'input', (rng) => {
    const central = randInt(rng, 20, 85) * 2;
    return {
      text: `Центральный угол AOB равен ${hl(central)}${deg}.`,
      question: 'Найдите вписанный угол ACB, опирающийся на ту же дугу. Ответ дайте в градусах.',
      figure: circleFigure({ points: [{ name: 'A', deg: 20 }, { name: 'B', deg: 20 + central }, { name: 'C', deg: 200 + central / 2 }], segments: [['O', 'A'], ['O', 'B'], ['C', 'A'], ['C', 'B']], angleAt: [{ vertex: 'O', from: 'A', to: 'B', text: `${central}°` }, { vertex: 'C', from: 'A', to: 'B', text: '?' }] }),
      figureAlt: `Окружность с центром O, центральный угол AOB = ${central}°, вписанный угол ACB`,
      answer: String(central / 2), expr: `${central} / 2`, unit: deg,
      hint: 'Вписанный угол равен половине центрального угла, опирающегося на ту же дугу.',
      steps: [`${central}° : 2 = ${central / 2}°`],
      wrong: [wrong(central * 2, 'wrongFormula', 'Вписанный угол вдвое меньше центрального, а не больше.')],
    };
  }),
  T('t16-1-same-arc', 't16', 1, 'input', (rng) => {
    const a = randInt(rng, 20, 80);
    return {
      text: `В окружности с центром O проведены диаметры AD и BC, угол OAB равен ${hl(a)}${deg}.`,
      question: 'Найдите величину угла OCD. Ответ дайте в градусах.',
      figure: circleFigure({ points: [{ name: 'A', deg: 200 }, { name: 'D', deg: 20 }, { name: 'B', deg: 200 - (180 - 2 * a) }, { name: 'C', deg: 20 - (180 - 2 * a) }], segments: [['A', 'D'], ['B', 'C'], ['A', 'B'], ['C', 'D']], angleAt: [{ vertex: 'A', from: 'D', to: 'B', text: `${a}°` }] }),
      figureAlt: `Окружность с центром O, диаметры AD и BC, угол OAB = ${a}°`,
      answer: String(a), expr: String(a), unit: deg,
      hint: 'Углы A и C — вписанные и опираются на одну дугу BD.',
      steps: ['∠OAB = ∠DAB и ∠OCD = ∠BCD — вписанные углы, опирающиеся на дугу BD', `Значит они равны: ${a}°`],
      wrong: [wrong(180 - a, 'wrongFormula', 'Вписанные углы на одну дугу равны, а не дополняют друг друга до 180°.')],
    };
  }),
  T('t16-2-center-on-side', 't16', 2, 'input', (rng) => {
    const a = randInt(rng, 15, 75);
    return {
      text: `Центр окружности, описанной около треугольника ABC, лежит на стороне AB. Угол BAC равен ${hl(a)}${deg}.`,
      question: 'Найдите угол ABC. Ответ дайте в градусах.',
      figure: circleFigure({ points: [{ name: 'A', deg: 180 }, { name: 'B', deg: 0 }, { name: 'C', deg: 180 - 2 * a }], segments: [['A', 'B'], ['A', 'C'], ['B', 'C']], angleAt: [{ vertex: 'A', from: 'B', to: 'C', text: `${a}°` }] }),
      figureAlt: `Треугольник ABC вписан в окружность, центр O лежит на стороне AB, угол A = ${a}°`,
      answer: String(90 - a), expr: `90 - ${a}`, unit: deg,
      hint: 'Если центр описанной окружности лежит на стороне, то угол напротив этой стороны прямой.',
      steps: ['AB — диаметр, значит ∠ACB = 90°', `∠ABC = 180° − 90° − ${a}° = ${90 - a}°`],
      wrong: [wrong(180 - a, 'wrongFormula', 'Угол C прямой, поэтому сумма углов A и B равна 90°.')],
    };
  }),
  T('t16-3-two-diameters', 't16', 3, 'input', (rng) => {
    const a = randInt(rng, 20, 70);
    return {
      text: `В окружности с центром O отрезки AC и BD — диаметры. Угол ACB равен ${hl(a)}${deg}.`,
      question: 'Найдите угол AOD. Ответ дайте в градусах.',
      figure: circleFigure({ points: [{ name: 'A', deg: 160 }, { name: 'C', deg: 340 }, { name: 'B', deg: 160 - 2 * a }, { name: 'D', deg: 340 - 2 * a }], segments: [['A', 'C'], ['B', 'D'], ['C', 'B']], angleAt: [{ vertex: 'C', from: 'A', to: 'B', text: `${a}°` }] }),
      figureAlt: `Окружность с центром O, диаметры AC и BD, угол ACB = ${a}°`,
      answer: String(180 - 2 * a), expr: `180 - 2 * ${a}`, unit: deg,
      hint: 'Вписанный угол ACB равен половине дуги AB. Дуга BAD — половина окружности.',
      steps: [`Дуга AB = 2 · ${a}° = ${2 * a}°`, `Дуга AD = 180° − ${2 * a}° = ${180 - 2 * a}°`, `∠AOD — центральный, равен дуге AD: ${180 - 2 * a}°`],
      wrong: [wrong(2 * a, 'wrongFormula', 'Это дуга AB, а нужен угол AOD.'), wrong(180 - a, 'wrongFormula', 'Дуга AB равна удвоенному вписанному углу.')],
    };
  }),
  T('t16-3-chord', 't16', 3, 'input', (rng) => {
    const central = randInt(rng, 50, 85) * 2;
    return {
      text: `Хорда AB стягивает дугу окружности в ${hl(central)}${deg}.`,
      question: 'Найдите угол между хордой AB и касательной, проведённой через точку A. Ответ дайте в градусах (меньший из углов).',
      answer: String(central / 2), expr: `${central} / 2`, unit: deg,
      hint: 'Угол между касательной и хордой равен половине дуги, заключённой между ними.',
      steps: [`${central}° : 2 = ${central / 2}°`],
      wrong: [wrong(central, 'wrongFormula', 'Угол равен половине дуги, а не самой дуге.')],
    };
  }),

  // ---- Task 17: quadrilaterals ----
  T('t17-0-adjacent', 't17', 0, 'input', (rng) => {
    const a = randInt(rng, 30, 150);
    return {
      text: `В параллелограмме ABCD угол A равен ${hl(a)}${deg}.`,
      question: 'Найдите угол B. Ответ дайте в градусах.',
      figure: quadFigure({ kind: 'parallelogram', angles: { A: `${a}°`, B: '?' }, skew: a < 90 ? 50 : -50 }),
      figureAlt: `Параллелограмм ABCD, угол A = ${a}°`,
      answer: String(180 - a), expr: `180 - ${a}`, unit: deg,
      hint: 'Соседние углы параллелограмма в сумме дают 180°.',
      steps: [`180° − ${a}° = ${180 - a}°`],
      wrong: [wrong(a, 'wrongFormula', 'Равны противоположные углы, а соседние дополняют друг друга до 180°.')],
    };
  }),
  T('t17-1-rhombus-angle', 't17', 1, 'input', (rng) => {
    const a = randInt(rng, 31, 89);
    return {
      text: `Угол A ромба ABCD равен ${hl(a)}${deg}.`,
      question: 'Найдите больший угол этого ромба. Ответ дайте в градусах.',
      figure: quadFigure({ kind: 'rhombus', angles: { A: `${a}°` } }),
      figureAlt: `Ромб ABCD, угол A = ${a}°`,
      answer: String(180 - a), expr: `180 - ${a}`, unit: deg,
      hint: 'Сумма соседних углов ромба равна 180°.',
      steps: [`180° − ${a}° = ${180 - a}°`],
      wrong: [wrong(360 - a, 'wrongFormula', 'Соседние углы в сумме дают 180°.')],
    };
  }),
  T('t17-2-rhombus-height', 't17', 2, 'input', (rng) => {
    const side = randInt(rng, 2, 20) * 2;
    return {
      text: `Сторона ромба равна ${hl(side)}, а один из углов этого ромба равен ${hl(150)}${deg}.`,
      question: 'Найдите высоту этого ромба.',
      figure: quadFigure({ kind: 'rhombus', angles: { B: '150°' }, height: { from: 'C' }, sideLabels: { DA: String(side) }, skew: 100 }),
      figureAlt: `Ромб ABCD со стороной ${side}, угол B = 150°, проведена высота`,
      answer: String(side / 2), expr: `${side} / 2`,
      hint: 'Острый угол ромба равен 30°. Катет против угла 30° равен половине гипотенузы.',
      steps: ['Острый угол: 180° − 150° = 30°', `Высота — катет против угла 30°: ${side} : 2 = ${side / 2}`],
      wrong: [wrong(side, 'wrongFormula', 'Высота меньше стороны: это катет против угла 30°.')],
    };
  }),
  T('t17-2-parallelogram-area', 't17', 2, 'input', (rng) => {
    const a = randInt(rng, 5, 20);
    const h = randInt(rng, 3, 12);
    return {
      text: `Сторона параллелограмма равна ${hl(a)}, а высота, проведённая к этой стороне, — ${hl(h)}.`,
      question: 'Найдите площадь параллелограмма.',
      figure: quadFigure({ kind: 'parallelogram', height: { from: 'C', text: String(h) }, sideLabels: { DA: String(a) } }),
      figureAlt: `Параллелограмм ABCD, сторона AD = ${a}, высота ${h}`,
      answer: String(a * h), expr: `${a} * ${h}`,
      hint: 'Площадь параллелограмма равна произведению стороны на проведённую к ней высоту.',
      steps: [`S = ${a} · ${h} = ${a * h}`],
      wrong: [wrong((a * h) / 2, 'wrongFormula', 'Делят пополам площадь треугольника, а не параллелограмма.')],
    };
  }),
  T('t17-3-rhombus-segment', 't17', 3, 'input', (rng) => {
    const side = randInt(rng, 5, 25) * 2;
    return {
      text: `Сторона ромба равна ${hl(side)}, а острый угол равен ${hl(60)}${deg}. Высота ромба, опущенная из вершины тупого угла, делит сторону на два отрезка.`,
      question: 'Найдите длину меньшего из этих отрезков.',
      figure: quadFigure({ kind: 'rhombus', angles: { A: '60°' }, height: { from: 'B' }, sideLabels: { DA: String(side) }, skew: 60 }),
      figureAlt: `Ромб ABCD со стороной ${side} и острым углом A = 60°, из вершины B опущена высота на AD`,
      answer: String(side / 2), expr: `${side} / 2`,
      hint: 'В прямоугольном треугольнике с углом 60° прилежащий катет равен половине гипотенузы (cos 60° = 1/2).',
      steps: [`Отрезок от вершины острого угла до основания высоты: ${side} · cos 60° = ${side / 2}`, `Второй отрезок: ${side} − ${side / 2} = ${side / 2}`],
      wrong: [wrong(side, 'wrongFormula', 'Нужен отрезок стороны, а не вся сторона.')],
    };
  }),
  T('t17-3-trapezoid-midline', 't17', 3, 'input', (rng) => {
    const a = randInt(rng, 4, 15);
    const b = a + randInt(rng, 2, 12) * 2;
    return {
      text: `Основания трапеции равны ${hl(a)} и ${hl(b)}.`,
      question: 'Найдите среднюю линию трапеции.',
      figure: quadFigure({ kind: 'trapezoid', sideLabels: { BC: String(a), DA: String(b) }, topWidth: 110, skew: 55 }),
      figureAlt: `Трапеция ABCD с основаниями BC = ${a} и AD = ${b}`,
      answer: String((a + b) / 2), expr: `(${a} + ${b}) / 2`,
      hint: 'Средняя линия трапеции равна полусумме оснований.',
      steps: [`(${a} + ${b}) : 2 = ${(a + b) / 2}`],
      wrong: [wrong(a + b, 'wrongFormula', 'Сумму оснований нужно разделить на 2.'), wrong((b - a) / 2, 'wrongFormula', 'Основания складывают, а не вычитают.')],
    };
  }),
];
