// Task 14: arithmetic and geometric progressions in word problems.
import { pick, randInt } from '../../src/lib/rng.ts';
import { canon, hl, show, sub, T, wrong, sup } from '../helpers.ts';
import type { TaskTemplate } from '../types.ts';

const t = 't14';
const dayWord = (n: number) => `${n}-й`;

export const t14: TaskTemplate[] = [
  T('t14-0-next', t, 0, 'input', (rng) => {
    const a1 = randInt(rng, 3, 20);
    const d = randInt(rng, 2, 9);
    const n = randInt(rng, 3, 6);
    return {
      text: `Каждый день спортсмен пробегает на ${hl(d)} круга больше, чем накануне. В первый день он пробежал ${hl(a1)} кругов.`,
      question: `Сколько кругов он пробежит в ${dayWord(n)} день?`,
      answer: String(a1 + (n - 1) * d), expr: `${a1} + (${n} - 1) * ${d}`,
      hint: `От первого дня до ${n}-го нужно прибавить ${d} ровно ${n - 1} раз${n - 1 > 1 ? 'а' : ''}.`,
      steps: [`${a1} + ${d} · ${n - 1} = ${a1 + (n - 1) * d}`],
      wrong: [wrong(a1 + n * d, 'wrongFormula', 'Прибавлять нужно n − 1 раз, а не n.')],
    };
  }),
  T('t14-1-term', t, 1, 'input', (rng) => {
    const a1 = pick(rng, [1, 2, 3, 5]);
    const d = pick(rng, [0.4, 0.5, 0.6, 0.8, 1.2, 1.5]);
    const n = randInt(rng, 5, 12);
    const an = Math.round((a1 + (n - 1) * d) * 10) / 10;
    return {
      text: `Поезд отходит от станции. За первую секунду он проходит ${hl(a1)} м, а за каждую следующую — на ${hl(d)} м больше, чем за предыдущую.`,
      question: `Сколько метров поезд пройдёт за ${n}-ю секунду?`,
      answer: canon(an), expr: `${a1} + (${n} - 1) * Rational(${Math.round(d * 10)}, 10)`, unit: 'м',
      hint: 'Это арифметическая прогрессия: aₙ = a₁ + (n − 1)·d.',
      steps: [`a${sub(n)} = ${a1} + ${d.toString().replace('.', ',')} · ${n - 1} = ${show(an)} м`],
      wrong: [wrong(Math.round((a1 + n * d) * 10) / 10, 'wrongFormula', 'В формуле множитель (n − 1), а не n.')],
    };
  }),
  T('t14-2-sum', t, 2, 'input', (rng) => {
    const a1 = pick(rng, [1, 2, 3, 4]);
    const d = pick(rng, [0.4, 0.5, 0.6, 0.8, 1, 1.5]);
    const n = pick(rng, [6, 7, 8, 10]);
    const an = a1 + (n - 1) * d;
    const sum = Math.round((((a1 + an) * n) / 2) * 10) / 10;
    return {
      text: `Поезд отходит от станции. За первую секунду он проходит ${hl(a1)} м, а за каждую следующую — на ${hl(d)} м больше, чем за предыдущую.`,
      question: `Сколько метров поезд пройдёт за первые ${n} секунд?`,
      answer: canon(sum), expr: `(2 * ${a1} + (${n} - 1) * Rational(${Math.round(d * 10)}, 10)) * ${n} / 2`, unit: 'м',
      hint: 'Сумма прогрессии: Sₙ = (a₁ + aₙ) · n / 2. Сначала найдите aₙ.',
      steps: [`a${sub(n)} = ${a1} + ${show(d)} · ${n - 1} = ${show(an)}`, `S = (${a1} + ${show(an)}) · ${n} / 2 = ${show(sum)} м`],
      wrong: [wrong(Math.round((a1 + an) * n * 10) / 10, 'wrongFormula', 'Сумму нужно разделить на 2.'), wrong(an, 'wrongFormula', 'Найден последний член, а нужна сумма всех.')],
    };
  }),
  T('t14-2-find-n', t, 2, 'input', (rng) => {
    const a1 = randInt(rng, 5, 30);
    const d = randInt(rng, 2, 8);
    const n = randInt(rng, 6, 15);
    const an = a1 + (n - 1) * d;
    return {
      text: `В первом ряду зала ${hl(a1)} мест, а в каждом следующем — на ${hl(d)} больше, чем в предыдущем.`,
      question: `В каком ряду ${hl(an)} мест?`,
      answer: String(n), expr: `(${an} - ${a1}) / ${d} + 1`,
      hint: 'Найдите, сколько раз прибавили d: (aₙ − a₁) : d, и добавьте 1.',
      steps: [`${an} − ${a1} = ${an - a1}; ${an - a1} : ${d} = ${n - 1}`, `Ряд: ${n - 1} + 1 = ${n}`],
      wrong: [wrong(n - 1, 'rounding', 'Число прибавлений на единицу меньше номера ряда.')],
    };
  }),
  T('t14-3-geometric', t, 3, 'input', (rng) => {
    const kind = randInt(rng, 0, 1);
    if (kind === 0) {
      const b1 = pick(rng, [2, 3, 5, 10, 20]);
      const q = pick(rng, [2, 3]);
      const n = randInt(rng, 4, q === 2 ? 7 : 5);
      return {
        text: `Количество бактерий в пробирке каждый час увеличивается в ${hl(q)} раза. В начале наблюдения их было ${hl(b1)}.`,
        question: `Сколько бактерий будет через ${n - 1} ${n - 1 < 5 ? 'часа' : 'часов'}?`,
        answer: String(b1 * q ** (n - 1)), expr: `${b1} * ${q}**(${n} - 1)`,
        hint: 'Это геометрическая прогрессия: bₙ = b₁ · qⁿ⁻¹.',
        steps: [`${b1} · ${q}${sup(n - 1)} = ${b1} · ${q ** (n - 1)} = ${b1 * q ** (n - 1)}`],
        wrong: [wrong(b1 + (n - 1) * q, 'wrongFormula', 'Количество умножается, а не прибавляется.')],
      };
    }
    const a1 = randInt(rng, 8, 40);
    const d = randInt(rng, 2, 6);
    const n = pick(rng, [8, 10, 12, 15, 20]);
    const sum = ((2 * a1 + (n - 1) * d) * n) / 2;
    return {
      text: `Улитка ползёт по дереву. За первый день она проползла ${hl(a1)} см, а за каждый следующий — на ${hl(d)} см больше, чем за предыдущий.`,
      question: `Сколько сантиметров улитка проползёт за ${n} дней?`,
      answer: String(sum), expr: `(2 * ${a1} + (${n} - 1) * ${d}) * ${n} / 2`, unit: 'см',
      hint: 'Sₙ = (2a₁ + (n − 1)d) · n / 2.',
      steps: [`a${sub(n)} = ${a1} + ${d} · ${n - 1} = ${a1 + (n - 1) * d}`, `S = (${a1} + ${a1 + (n - 1) * d}) · ${n} / 2 = ${show(sum)} см`],
      wrong: [wrong(a1 + (n - 1) * d, 'wrongFormula', 'Это путь за последний день, а нужна сумма за все дни.')],
    };
  }),
];
