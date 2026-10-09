// Step-by-step discount problems for the guided task screens.
import type { Task } from '../../content/types.ts';
import { createRng, pick, randInt } from '@/lib/rng.ts';
import { show } from '../../content/helpers.ts';

export const UNIT = 'у.е.';

export interface GuidedProblem {
  seed: string;
  item: string;
  oldPrice: number;
  percent: number;
  newPrice: number;
  multiplier: number; // 1 − p/100
}

const ITEMS = ['куртки', 'кроссовок', 'рюкзака', 'наушников', 'велосипеда', 'настольной игры'];

export function makeGuided(seed: string): GuidedProblem {
  const rng = createRng(`guided:${seed}`);
  const percent = pick(rng, [10, 15, 20, 25, 30, 40]);
  const oldPrice = randInt(rng, 5, 90) * 100;
  return {
    seed,
    item: pick(rng, ITEMS),
    oldPrice,
    percent,
    newPrice: (oldPrice * (100 - percent)) / 100,
    multiplier: (100 - percent) / 100,
  };
}

export const problemText = (p: GuidedProblem) =>
  `Цена ${p.item} снизилась на [[${p.percent}]]%. Сколько стал стоить товар, если его начальная стоимость [[${show(p.oldPrice)}]] ${UNIT}?`;

/** A Task wrapper so guided answers flow through the normal progress pipeline. */
export function guidedAsTask(p: GuidedProblem): Task {
  return {
    id: `guided-${p.seed}`,
    templateId: 'guided-discount',
    topicId: 't6',
    level: 2,
    format: 'input',
    rating: 1000,
    text: problemText(p),
    question: 'Найдите новую цену.',
    answer: String(p.newPrice),
    expr: `${p.oldPrice} * (100 - ${p.percent}) / 100`,
    unit: UNIT,
    hint: `После скидки ${p.percent}% остаётся ${100 - p.percent}% цены.`,
    steps: [`Новая цена = ${show(p.oldPrice)} × ${show(p.multiplier)} = ${show(p.newPrice)} ${UNIT}`],
    wrong: [
      { value: String((p.oldPrice * p.percent) / 100), error: 'wrongFormula', note: 'Это размер скидки, а не новая цена.' },
      { value: String((p.oldPrice * (100 + p.percent)) / 100), error: 'sign', note: 'Цену уменьшили, а не увеличили.' },
    ],
  };
}
