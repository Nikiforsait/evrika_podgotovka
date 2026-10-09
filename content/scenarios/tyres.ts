// Scenario "tyres": tasks 1–5 about tyre markings. The table and all numbers are generated.
import { pick, shuffle } from '../../src/lib/rng.ts';
import { canon, fromNumber, show, wrong } from '../helpers.ts';
import { tyreFigure } from '../scenarioFigures.ts';
import type { ScenarioPart, ScenarioTemplate, TaskDraft, TaskTable } from '../types.ts';

const CONTEXT =
  'Автомобильное колесо — металлический диск с резиновой шиной (см. рисунок); диаметр диска d равен диаметру внутреннего отверстия шины. Маркировка шины, например [[195/65 R15]]: первое число — ширина шины B в мм; второе — высота боковины H в процентах от ширины (195 · 0,65 = 126,75 мм); после буквы R указан диаметр диска d в дюймах (1 дюйм = 25,4 мм). Полный диаметр колеса D = d · 25,4 + 2H.';

const DISKS = [13, 14, 15];
const dec = (x: number, digits = 2) => Math.round(x * 10 ** digits) / 10 ** digits;
/** SymPy literal for a decimal number. */
const ex = (x: number) => {
  const r = fromNumber(x);
  return r.d === 1 ? String(r.n) : `Rational(${r.n}, ${r.d})`;
};
const inch = (d: number) => d * 25.4;
const sidewall = (B: number, p: number) => (B * p) / 100;
const diameter = (B: number, p: number, d: number) => inch(d) + 2 * sidewall(B, p);
const mark = (B: number, p: number, d: number) => `[[${B}/${p} R${d}]]`;
const part = (topicId: string, format: ScenarioPart['format'], draft: TaskDraft): ScenarioPart => ({ topicId, format, draft });

export const tyres: ScenarioTemplate = {
  id: 'tyres',
  generate(rng, level) {
    // Level 1 keeps sidewall heights integer; higher levels allow decimals.
    const widths = level === 1 ? [160, 180, 200, 220] : [165, 175, 185, 195, 205];
    const profiles = level === 1 ? [50, 60] : [55, 60, 65, 70];
    const rows = shuffle(rng, widths).slice(0, level + 2).sort((a, b) => a - b);
    const cell: Record<string, number | null> = {};
    for (const w of rows) for (const d of DISKS) cell[`${w}/${d}`] = rng() < 0.6 ? pick(rng, profiles) : null;
    const factoryW = rows[0]!;
    const factoryP = pick(rng, profiles);
    cell[`${factoryW}/13`] = factoryP;
    const table: TaskTable = {
      head: ['Ширина шины, мм', ...DISKS.map((d) => `Диск R${d}`)],
      rows: rows.map((w) => [String(w), ...DISKS.map((d) => (cell[`${w}/${d}`] === null ? '—' : `${w}/${cell[`${w}/${d}`]}`))]),
    };
    const common = {
      text: `${CONTEXT} Завод выпускает автомобили с шинами ${mark(factoryW, factoryP, 13)} и допускает установку других размеров, перечисленных в таблице (прочерк — размер не разрешён).`,
      table,
      figure: tyreFigure(),
      figureAlt: 'Колесо в разрезе: диаметр диска d, ширина шины B, высота боковины H, полный диаметр D',
    };

    // 1 — reading the table
    const d1 = pick(rng, DISKS);
    const allowed = rows.filter((w) => cell[`${w}/${d1}`] !== null);
    if (!allowed.length) throw new Error('retry');
    const totalAllowed = rows.reduce((s, w) => s + DISKS.filter((d) => cell[`${w}/${d}`] !== null).length, 0);
    const extreme = level === 1 ? Math.max(...allowed) : Math.min(...allowed);
    const t1 =
      level === 3
        ? part('t1', 'input', {
            ...common,
            question: 'Сколько всего размеров шин (включая заводской) разрешено устанавливать на этот автомобиль?',
            answer: String(totalAllowed),
            expr: String(totalAllowed),
            hint: 'Посчитайте все заполненные ячейки таблицы.',
            steps: [`Заполненных ячеек: ${totalAllowed}`],
            wrong: [wrong(rows.length * DISKS.length, 'wrongFormula', 'Прочерки считать не нужно.')],
          })
        : part('t1', 'input', {
            ...common,
            question: `Шины какой ${level === 1 ? 'наибольшей' : 'наименьшей'} ширины можно установить на диск диаметром ${d1} дюймов? Ответ дайте в миллиметрах.`,
            answer: String(extreme),
            expr: String(extreme),
            unit: 'мм',
            hint: `Смотрите только столбец «Диск R${d1}» и выбирайте среди заполненных ячеек.`,
            steps: [`Для диска R${d1} разрешены ширины: ${allowed.join(', ')}`, `${level === 1 ? 'Наибольшая' : 'Наименьшая'}: ${extreme} мм`],
            wrong: [wrong(level === 1 ? Math.max(...rows) : Math.min(...rows), 'wrongFormula', 'Нужно учитывать только разрешённые ячейки нужного столбца.')],
          });

    // 2 — sidewall height
    const B2 = pick(rng, rows);
    const p2 = pick(rng, profiles);
    const d2 = pick(rng, DISKS);
    const H2 = sidewall(B2, p2);
    const t2 = part('t2', 'input', {
      ...common,
      question: `Сколько миллиметров составляет высота боковины шины с маркировкой ${mark(B2, p2, d2)}?`,
      answer: canon(H2),
      expr: ex(H2),
      unit: 'мм',
      hint: 'Высота боковины — проценты от ширины: H = B · p / 100.',
      steps: [`H = ${B2} · ${show(p2 / 100)} = ${show(H2)} мм`],
      wrong: [wrong(B2 * p2, 'decimal', 'Забыли разделить на 100.'), wrong(p2, 'wrongFormula', 'Второе число — проценты, а не миллиметры.')],
    });

    // 3 — full wheel diameter
    const B3 = pick(rng, rows);
    const p3 = pick(rng, profiles);
    const d3 = pick(rng, DISKS);
    const D3 = dec(diameter(B3, p3, d3), 2);
    const t3 = part('t3', 'input', {
      ...common,
      question: `Найдите диаметр колеса с шиной ${mark(B3, p3, d3)}. Ответ дайте в миллиметрах.`,
      answer: canon(D3),
      expr: ex(D3),
      unit: 'мм',
      hint: 'D = d · 25,4 + 2H, где H — высота боковины.',
      steps: [`H = ${B3} · ${show(p3 / 100)} = ${show(sidewall(B3, p3))} мм`, `d = ${d3} · 25,4 = ${show(inch(d3))} мм`, `D = ${show(inch(d3))} + 2 · ${show(sidewall(B3, p3))} = ${show(D3)} мм`],
      wrong: [wrong(dec(inch(d3) + sidewall(B3, p3), 2), 'wrongFormula', 'Боковина входит в диаметр дважды — сверху и снизу.')],
    });

    // 4 — difference of diameters (level 1) or radii (levels 2–3) on the same disk
    const d4 = pick(rng, DISKS);
    const [Ba, Bb] = shuffle(rng, rows).slice(0, 2) as [number, number];
    const pa = pick(rng, profiles);
    const pb = pick(rng, profiles);
    const Da = diameter(Ba, pa, d4);
    const Db = diameter(Bb, pb, d4);
    if (Da === Db) throw new Error('retry');
    const [bigM, smallM] = Da > Db ? [mark(Ba, pa, d4), mark(Bb, pb, d4)] : [mark(Bb, pb, d4), mark(Ba, pa, d4)];
    const dDiff = dec(Math.abs(Da - Db), 3);
    const rDiff = dec(dDiff / 2, 3);
    const t4 = part('t4', 'input', {
      ...common,
      question:
        level === 1
          ? `На сколько миллиметров диаметр колеса с шиной ${bigM} больше диаметра колеса с шиной ${smallM}?`
          : `На сколько миллиметров радиус колеса с шиной ${smallM} меньше радиуса колеса с шиной ${bigM}?`,
      answer: canon(level === 1 ? dDiff : rDiff),
      expr: ex(level === 1 ? dDiff : rDiff),
      unit: 'мм',
      hint: 'Диск одинаковый, поэтому разница диаметров равна удвоенной разнице высот боковин.',
      steps: [
        `H₁ = ${show(sidewall(Ba, pa))} мм, H₂ = ${show(sidewall(Bb, pb))} мм`,
        `Разница диаметров: 2 · |H₁ − H₂| = ${show(dDiff)} мм`,
        ...(level === 1 ? [] : [`Разница радиусов: ${show(dDiff)} : 2 = ${show(rDiff)} мм`]),
      ],
      wrong: [wrong(level === 1 ? rDiff : dDiff, 'wrongFormula', level === 1 ? 'Это разница радиусов, а спрашивали диаметры.' : 'Это разница диаметров; радиус — половина.')],
    });

    // 5 — replacing the factory tyre: diameter growth (level 1) or percent (levels 2–3)
    const d5 = level === 3 ? pick(rng, [14, 15]) : 13;
    const B5 = pick(rng, rows.filter((w) => w !== factoryW));
    const p5 = pick(rng, profiles);
    const D0 = diameter(factoryW, factoryP, 13);
    const D5 = diameter(B5, p5, d5);
    if (D5 <= D0) throw new Error('retry');
    const growMm = dec(D5 - D0, 2);
    const pct = dec(((D5 - D0) / D0) * 100, 1);
    const t5 = part('t5', 'input', {
      ...common,
      question:
        level === 1
          ? `На сколько миллиметров увеличится диаметр колеса, если заменить заводские шины шинами ${mark(B5, p5, d5)}?`
          : `На сколько процентов увеличится пробег автомобиля за один оборот колеса, если заменить заводские шины шинами ${mark(B5, p5, d5)}? Результат округлите до десятых.`,
      answer: canon(level === 1 ? growMm : pct),
      expr: ex(level === 1 ? growMm : pct),
      unit: level === 1 ? 'мм' : '%',
      hint: level === 1 ? 'Найдите оба диаметра по формуле D = d · 25,4 + 2H и вычтите.' : 'Пробег за оборот пропорционален диаметру колеса: сравните диаметры с заводским.',
      steps: [`D₁ = ${show(dec(D0, 2))} мм (заводское), D₂ = ${show(dec(D5, 2))} мм`, level === 1 ? `D₂ − D₁ = ${show(growMm)} мм` : `(D₂ − D₁) / D₁ · 100 ≈ ${show(pct)}%`],
      wrong: [level === 1 ? wrong(dec(growMm / 2, 2), 'wrongFormula', 'Это разница радиусов.') : wrong(dec(((D5 - D0) / D5) * 100, 1), 'wrongFormula', 'Проценты считают от заводского диаметра.')],
    });
    return [t1, t2, t3, t4, t5];
  },
};
