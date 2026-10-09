// Task 19: judging geometry statements.
import { pick, shuffle } from '../../src/lib/rng.ts';
import { labelled, T, yesNo } from '../helpers.ts';
import type { TaskTemplate } from '../types.ts';
import { STATEMENTS, type Statement } from './t19-statements.ts';

const t = 't19';
const byTier = (tier: 1 | 2 | 3, truth?: boolean) => STATEMENTS.filter((s) => s.tier === tier && (truth === undefined || s.truth === truth));

const pickDistinct = (rng: () => number, pool: Statement[], n: number) => shuffle(rng, pool).slice(0, n);

export const t19: TaskTemplate[] = [
  T('t19-0-yesno', t, 0, 'choice', (rng) => {
    const st = pick(rng, byTier(1));
    return {
      text: `Утверждение: «${st.text}»`,
      question: 'Верно ли это утверждение?',
      ...yesNo(st.truth),
      hint: st.hint,
      steps: [st.truth ? 'Утверждение верно.' : 'Утверждение неверно.', st.hint],
      wrong: [],
    };
  }),
  T('t19-1-yesno', t, 1, 'choice', (rng) => {
    const st = pick(rng, byTier(2));
    return {
      text: `Утверждение: «${st.text}»`,
      question: 'Верно ли это утверждение?',
      ...yesNo(st.truth),
      hint: st.hint,
      steps: [st.truth ? 'Утверждение верно.' : 'Утверждение неверно.', st.hint],
      wrong: [],
    };
  }),
  T('t19-2-pick-true', t, 2, 'choice', (rng) => {
    const tier = pick(rng, [1, 2] as const);
    const good = pick(rng, byTier(tier, true));
    const bad = pickDistinct(rng, byTier(tier, false), 2);
    const list = shuffle(rng, [good, ...bad]);
    return {
      text: list.map((s, i) => `${i + 1}) ${s.text}`).join(' '),
      question: 'Какое из утверждений верно?',
      ...labelled(list.map((_, i) => `Утверждение ${i + 1}`), list.indexOf(good) + 1),
      hint: 'Проверьте каждое утверждение: вспомните определение или теорему.',
      steps: list.map((s, i) => `${i + 1}) ${s.truth ? 'верно' : 'неверно'}: ${s.hint}`),
      wrong: [],
    };
  }),
  T('t19-3-all-true', t, 3, 'input', (rng) => {
    const tier = pick(rng, [2, 3] as const);
    const trueCount = pick(rng, [1, 2]);
    const good = pickDistinct(rng, byTier(tier, true), trueCount);
    const bad = pickDistinct(rng, byTier(tier, false), 3 - trueCount);
    const list = shuffle(rng, [...good, ...bad]);
    const answer = list
      .map((s, i) => (s.truth ? String(i + 1) : ''))
      .filter(Boolean)
      .join('');
    return {
      text: list.map((s, i) => `${i + 1}) ${s.text}`).join(' '),
      question: 'Укажите номера верных утверждений. Запишите цифры без пробелов (порядок не важен).',
      answer, expr: answer, display: 'digits', answerMode: 'digitset',
      hint: 'Верных утверждений может быть одно или два. Проверьте каждое отдельно.',
      steps: list.map((s, i) => `${i + 1}) ${s.truth ? 'верно' : 'неверно'}: ${s.hint}`),
      wrong: [],
    };
  }),
];
