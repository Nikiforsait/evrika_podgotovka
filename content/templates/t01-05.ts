// Tasks 1–5, foundation drills only (level 0). The full practical scenarios with a
// table and a figure live in content/scenarios/ and cover levels 1–3.
import { randInt } from '../../src/lib/rng.ts';
import { hl, labelled, show, T, wrong } from '../helpers.ts';
import type { TaskTemplate } from '../types.ts';

const CONTEXT =
  'Форматы листов бумаги обозначают буквой A и числом: A0, A1, A2 и так далее. Если разрезать лист пополам поперёк длинной стороны, получаются два листа следующего формата: из A0 — два A1, из A1 — два A2.';
const fmt = (n: number) => `A${n}`;
const SIDES = [1189, 841, 594, 420, 297, 210, 148, 105];

export const t0105: TaskTemplate[] = [
  T('t1-bigger', 't1', 0, 'choice', (rng) => {
    const a = randInt(rng, 0, 5);
    const b = a + randInt(rng, 1, 2);
    const bigFirst = rng() < 0.5;
    const [x, y] = bigFirst ? [a, b] : [b, a];
    return {
      text: CONTEXT,
      question: `Какой лист больше: ${fmt(x)} или ${fmt(y)}?`,
      ...labelled([fmt(x), fmt(y)], bigFirst ? 1 : 2),
      hint: 'Чем меньше число после буквы A, тем больше лист.',
      steps: [`${fmt(a)} получается раньше при разрезании, значит он больше ${fmt(b)}.`],
      wrong: [],
    };
  }),
  T('t2-count-0', 't2', 0, 'input', (rng) => {
    const from = randInt(rng, 0, 6);
    return {
      text: CONTEXT,
      question: `Сколько листов формата ${fmt(from + 1)} получится из одного листа ${fmt(from)}?`,
      answer: '2',
      expr: '2',
      hint: 'Один разрез пополам даёт два листа.',
      steps: [`${fmt(from)} разрезают пополам — получается 2 листа ${fmt(from + 1)}`],
      wrong: [wrong(4, 'wrongFormula', 'Один шаг формата — это один разрез, то есть два листа.')],
    };
  }),
  T('t3-half-side', 't3', 0, 'input', (rng) => {
    const i = randInt(rng, 0, 5);
    const long = SIDES[i]!;
    const res = long % 2 === 0 ? long / 2 : (long - 1) / 2;
    return {
      text: `${CONTEXT} Длинная сторона листа равна ${hl(long)} мм.`,
      question: 'Найдите длинную сторону следующего формата (половину этой стороны, округлённую вниз до целого). Ответ дайте в миллиметрах.',
      answer: String(res),
      expr: String(res),
      unit: 'мм',
      hint: 'При разрезании пополам длинная сторона делится на 2.',
      steps: [`${long} : 2 = ${show(long / 2)} → ${res} мм`],
      wrong: [wrong(long * 2, 'wrongFormula', 'Следующий формат меньше, сторону надо делить, а не умножать.')],
    };
  }),
  T('t4-mm-to-cm', 't4', 0, 'input', (rng) => {
    const mm = SIDES[randInt(rng, 2, 7)]!;
    return {
      text: CONTEXT,
      question: `Сторона листа равна ${hl(mm)} мм. Выразите её в сантиметрах.`,
      answer: `${mm}/10`,
      expr: `Rational(${mm}, 10)`,
      unit: 'см',
      hint: 'В 1 см — 10 мм.',
      steps: [`${mm} : 10 = ${show(mm / 10)} см`],
      wrong: [wrong(mm / 100, 'decimal', 'В сантиметре 10 мм, а не 100.')],
    };
  }),
  T('t5-mass-simple', 't5', 0, 'input', (rng) => {
    const sheets = randInt(rng, 2, 9) * 10;
    const gram = randInt(rng, 3, 9);
    return {
      text: 'Масса одного листа бумаги известна.',
      question: `Масса одного листа равна ${hl(gram)} г. Найдите массу пачки из ${hl(sheets)} листов. Ответ дайте в граммах.`,
      answer: String(sheets * gram),
      expr: `${sheets} * ${gram}`,
      unit: 'г',
      hint: 'Масса пачки = масса листа · число листов.',
      steps: [`${gram} · ${sheets} = ${sheets * gram} г`],
      wrong: [wrong(sheets + gram, 'wrongFormula', 'Нужно умножать, а не складывать.')],
    };
  }),
];
