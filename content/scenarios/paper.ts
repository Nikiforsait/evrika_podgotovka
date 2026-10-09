// Scenario "paper formats": tasks 1–5 built from one table of sheet sizes.
// The sizes are the standard ISO values (public facts); every question is our own.
import { pick, randInt, shuffle } from '../../src/lib/rng.ts';
import { digits, hl, show, sup, wrong } from '../helpers.ts';
import { paperFigure } from '../scenarioFigures.ts';
import type { ScenarioPart, ScenarioTemplate, TaskDraft, TaskTable } from '../types.ts';

const CONTEXT =
  'Форматы листов бумаги обозначают буквой A и числом: A0, A1, A2 и так далее. Лист A0 — прямоугольник площадью [[1]] м². Если разрезать лист пополам поперёк длинной стороны, получаются два листа следующего формата: из A0 — два A1, из A1 — два A2 (см. рисунок). Отношение сторон у всех листов одинаково и равно √2.';

/** Real dimensions, mm (length × width). */
const SIZES: Record<number, [number, number]> = {
  0: [1189, 841], 1: [841, 594], 2: [594, 420], 3: [420, 297], 4: [297, 210], 5: [210, 148], 6: [148, 105], 7: [105, 74],
};
const fmt = (n: number) => `A${n}`;
const dims = (n: number) => `${SIZES[n]![0]}×${SIZES[n]![1]} мм`;
const toTens = (x: number) => Math.round(x / 10) * 10;
const stepsWord = (n: number) => (n === 1 ? 'шаг' : n < 5 ? 'шага' : 'шагов');

/** Exact dimension derived from A4 = 297×210 by doubling/halving. */
function derivedFromA4(n: number): { length: number; width: number } {
  let length = 297;
  let width = 210;
  for (let k = 4; k > n; k--) [length, width] = [width * 2, length];
  for (let k = 4; k < n; k++) [length, width] = [width, length / 2];
  return { length, width };
}

const part = (topicId: string, format: ScenarioPart['format'], draft: TaskDraft): ScenarioPart => ({ topicId, format, draft });

export const paper: ScenarioTemplate = {
  id: 'paper',
  generate(rng, level) {
    const count = level + 2;
    const shown = shuffle(rng, [0, 1, 2, 3, 4, 5, 6]).slice(0, count).sort((p, q) => p - q);
    const order = shuffle(rng, shown);
    const table: TaskTable = {
      head: ['№', 'Длина, мм', 'Ширина, мм'],
      rows: order.map((f, i) => [String(i + 1), String(SIZES[f]![0]), String(SIZES[f]![1])]),
    };
    const common = {
      text: `${CONTEXT} В таблице приведены размеры ${count} листов разных форматов.`,
      table,
      figure: paperFigure(),
      figureAlt: 'Лист A0, разрезанный на листы A1, A2, A3, A4, A5',
    };

    // 1 — match formats to numbered rows
    const matchAnswer = shown.map((f) => order.indexOf(f) + 1).join('');
    const t1 = part('t1', 'input', {
      ...common,
      question: `Установите соответствие между форматами ${shown.map(fmt).join(', ')} и строками таблицы. В ответ запишите номера строк в том же порядке, без пробелов.`,
      ...digits(matchAnswer),
      hint: 'Чем меньше номер формата, тем больше лист: расставьте строки по убыванию длины.',
      steps: [`По убыванию длины: ${shown.map((f) => `${fmt(f)} — ${dims(f)} (строка ${order.indexOf(f) + 1})`).join('; ')}`, `Ответ: ${matchAnswer}`],
      wrong: [],
    });

    // 2 — how many smaller sheets
    const diff = [randInt(rng, 1, 2), randInt(rng, 2, 3), randInt(rng, 3, 5)][level - 1]!;
    const from = randInt(rng, 0, 7 - diff);
    const to = from + diff;
    const t2 = part('t2', 'input', {
      ...common,
      question: `Сколько листов формата ${fmt(to)} получится из одного листа ${fmt(from)}?`,
      answer: String(2 ** diff),
      expr: `2**${diff}`,
      hint: 'Каждый шаг формата удваивает количество листов.',
      steps: [`От ${fmt(from)} до ${fmt(to)} — ${diff} ${stepsWord(diff)}`, `2${sup(diff)} = ${2 ** diff}`],
      wrong: [wrong(2 * diff, 'wrongFormula', 'Количество удваивается на каждом шаге, а не прибавляется.')],
    });

    // 3 — a side of a format (preferably not in the table), derived from A4
    const pool = [[3, 5], [2, 6], [0, 1, 7]][level - 1]!;
    const candidates = pool.filter((f) => !shown.includes(f));
    const target = pick(rng, candidates.length ? candidates : pool);
    const side = pick(rng, ['длину', 'ширину'] as const);
    const d = derivedFromA4(target);
    const exact = side === 'длину' ? d.length : d.width;
    const t3 = part('t3', 'input', {
      ...common,
      text: `${common.text} Размер листа A4 — [[297]]×[[210]] мм.`,
      question: `Найдите ${side} листа ${fmt(target)}. Ответ дайте в миллиметрах, округлив до десятков.`,
      answer: String(toTens(exact)),
      expr: String(toTens(exact)),
      unit: 'мм',
      hint: 'Переходя к следующему формату, длинную сторону делим пополам, а короткая становится длинной.',
      steps: [`${side === 'длину' ? 'Длина' : 'Ширина'} ${fmt(target)} = ${show(exact)} мм`, `Округляем до десятков: ${toTens(exact)}`],
      wrong: [wrong(toTens(side === 'длину' ? d.width : d.length), 'wrongFormula', 'Перепутаны длина и ширина листа.')],
    });

    // 4 — area
    let t4: ScenarioPart;
    if (level === 1) {
      const f = pick(rng, shown.filter((x) => x >= 2));
      const [l, w] = SIZES[f]!;
      t4 = part('t4', 'input', {
        ...common,
        question: `Найдите площадь листа ${fmt(f)} (строка ${order.indexOf(f) + 1} таблицы). Ответ дайте в квадратных сантиметрах.`,
        answer: `${l * w}/100`,
        expr: `Rational(${l} * ${w}, 100)`,
        unit: 'см²',
        hint: 'Переведите стороны в сантиметры, затем перемножьте.',
        steps: [`${show(l / 10)} см · ${show(w / 10)} см = ${show((l * w) / 100)} см²`],
        wrong: [wrong(l * w, 'decimal', 'Площадь посчитана в мм², а нужна в см².')],
      });
    } else if (level === 2) {
      const n = randInt(rng, 1, 5);
      t4 = part('t4', 'input', {
        ...common,
        question: `Найдите площадь листа ${fmt(n)}. Ответ дайте в квадратных сантиметрах.`,
        answer: String(10000 / 2 ** n),
        expr: `10000 / 2**${n}`,
        unit: 'см²',
        hint: 'Площадь A0 = 1 м² = 10 000 см². Каждый следующий формат вдвое меньше.',
        steps: [`S(${fmt(n)}) = 10 000 : 2${sup(n)} = ${show(10000 / 2 ** n)} см²`],
        wrong: [wrong(10000 / (2 * n), 'wrongFormula', 'Площадь делится пополам на каждом шаге, то есть на 2ⁿ.')],
      });
    } else {
      const a = randInt(rng, 0, 3);
      const b = a + randInt(rng, 2, 4);
      t4 = part('t4', 'input', {
        ...common,
        question: `Во сколько раз площадь листа ${fmt(a)} больше площади листа ${fmt(b)}?`,
        answer: String(2 ** (b - a)),
        expr: `2**${b - a}`,
        hint: 'Каждый шаг формата уменьшает площадь вдвое.',
        steps: [`Шагов: ${b - a}`, `2${sup(b - a)} = ${2 ** (b - a)}`],
        wrong: [wrong(2 * (b - a), 'wrongFormula', 'Площадь уменьшается в 2 раза на каждом шаге — степень, а не произведение.')],
      });
    }

    // 5 — mass of a pack (levels 1, 3) or font scaling (level 2)
    let t5: ScenarioPart;
    if (level === 2) {
      const src = randInt(rng, 2, 4);
      const size = pick(rng, [10, 12, 14, 16, 18]);
      const smaller = rng() < 0.5;
      const dst = smaller ? src + 2 : src - 2;
      const res = smaller ? size / 2 : size * 2;
      t5 = part('t5', 'input', {
        ...common,
        question: `Размер шрифта измеряется в пунктах. Текст напечатан на листе ${fmt(src)} шрифтом ${hl(size)} пунктов. Какого размера нужен шрифт, чтобы тот же текст так же разместился на листе ${fmt(dst)}?`,
        answer: String(res),
        expr: smaller ? `Rational(${size}, 2)` : `${size} * 2`,
        unit: 'пт',
        hint: 'Через два формата стороны листа меняются ровно в 2 раза.',
        steps: [`Разница форматов — 2 шага: стороны ${smaller ? 'меньше' : 'больше'} в (√2)² = 2 раза`, `${size} ${smaller ? ': 2' : '· 2'} = ${show(res)}`],
        wrong: [wrong(smaller ? size * 2 : size / 2, 'wrongFormula', 'Шрифт меняется в ту же сторону, что и размер листа.')],
      });
    } else {
      const n = level === 1 ? 4 : pick(rng, [1, 2, 3, 5]);
      const sheets = pick(rng, [80, 100, 200, 250, 500]);
      const density = pick(rng, [80, 96, 120, 128, 160]);
      const area = 2 ** n;
      if ((density * sheets) % area !== 0) throw new Error('retry');
      const res = (density * sheets) / area;
      t5 = part('t5', 'input', {
        ...common,
        question: `Бумагу формата ${fmt(n)} упаковали в пачки по ${hl(sheets)} листов. Найдите массу пачки в граммах, если масса бумаги площадью 1 м² равна ${hl(density)} г.`,
        answer: String(res),
        expr: `${density} * ${sheets} / ${area}`,
        unit: 'г',
        hint: `Площадь ${fmt(n)} — 1/${area} м². Масса = плотность · число листов · площадь листа.`,
        steps: [`S(${fmt(n)}) = 1 : 2${sup(n)} = 1/${area} м²`, `${density} · ${sheets} : ${area} = ${show(res)} г`],
        wrong: [wrong(density * sheets, 'wrongFormula', 'Не учтено, что лист — лишь часть квадратного метра.')],
      });
    }
    return [t1, t2, t3, t4, t5];
  },
};
