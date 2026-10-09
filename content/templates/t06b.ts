// Task 6, part 2: decimal division, reciprocals / complex fractions, percentages.
import { pick, randInt } from '../../src/lib/rng.ts';
import { add, div, rat } from '../../src/lib/rational.ts';
import { canon, frac, hl, hlRaw, R, show, T, wrong } from '../helpers.ts';
import type { TaskTemplate } from '../types.ts';

const t = 't6';
const unit = 'у.е.';

export const t06b: TaskTemplate[] = [
  // ---- 6.4 division ----
  T('t6-4-int', t, 0, 'input', (rng) => {
    const b = randInt(rng, 3, 12);
    const q = randInt(rng, 4, 23);
    return {
      text: `Вычислите: ${hl(b * q)} : ${hl(b)}.`,
      question: 'Запишите ответ числом.',
      answer: String(q), expr: `${b * q} / ${b}`,
      hint: 'Подберите множитель: на что умножить делитель, чтобы получить делимое?',
      steps: [`${b} · ${q} = ${b * q}, значит ${b * q} : ${b} = ${q}`],
      wrong: [wrong(q + 1, 'rounding', 'Проверьте подбор множителя.')],
    };
  }),
  T('t6-4-dec-by-dec', t, 1, 'input', (rng) => {
    const b = randInt(rng, 3, 19) / 10;
    const q = randInt(rng, 2, 14);
    const a = Math.round(b * q * 10) / 10;
    return {
      text: `Найдите значение выражения ${hl(a)} : ${hl(b)}.`,
      question: 'Запишите ответ числом.',
      answer: String(q), expr: `${R(Math.round(a * 10), 10)} / ${R(Math.round(b * 10), 10)}`,
      hint: 'Умножьте оба числа на 10 — делитель станет натуральным.',
      steps: [`${Math.round(a * 10)} : ${Math.round(b * 10)} = ${q}`],
      wrong: [wrong(q * 10, 'decimal', 'Запятую нужно сдвинуть в обоих числах одинаково.')],
    };
  }),
  T('t6-4-shift2', t, 2, 'input', (rng) => {
    const b = pick(rng, [0.05, 0.08, 0.03, 0.04, 0.06, 0.02, 0.07, 0.09]);
    const q = pick(rng, [13, 17, 30, 40, 70, 90, 60, 80, 25, 45]);
    const a = Math.round(b * q * 100) / 100;
    return {
      text: `Найдите значение выражения ${hl(a)} : ${hl(b)}.`,
      question: 'Запишите ответ числом.',
      answer: String(q), expr: `${R(Math.round(a * 100), 100)} / ${R(Math.round(b * 100), 100)}`,
      hint: 'Сдвиньте запятую на два знака в обоих числах.',
      steps: [`${show(a * 100)} : ${Math.round(b * 100)} = ${q}`],
      wrong: [wrong(q / 10, 'decimal', 'Запятая сдвинута только на один знак.')],
    };
  }),
  T('t6-4-small', t, 3, 'input', (rng) => {
    const b = pick(rng, [0.9, 1.2, 0.7, 0.4, 0.6, 0.32, 0.03, 0.014, 0.05]);
    const q = pick(rng, [0.4, 0.07, 0.6, 7.2, 0.05, 1.7, 0.3, 24, 400, 64]);
    const a = Math.round(b * q * 100000) / 100000;
    return {
      text: `Найдите значение выражения ${hl(a)} : ${hl(b)}.`,
      question: 'Запишите ответ числом.',
      answer: canon(q), expr: `${R(Math.round(a * 100000), 100000)} / ${R(Math.round(b * 1000), 1000)}`,
      hint: 'Сдвиньте запятые так, чтобы делитель стал натуральным, затем делите уголком.',
      steps: [`Делитель ${show(b)} → натуральное число, делимое сдвигаем так же`, `Результат: ${show(q)}`],
      wrong: [wrong(q * 10, 'decimal', 'Проверьте, на сколько знаков сдвинута запятая.'), wrong(q / 10, 'decimal', 'Проверьте, на сколько знаков сдвинута запятая.')],
    };
  }),

  // ---- 6.5 reciprocals and complex fractions ----
  T('t6-5-flip', t, 0, 'input', (rng) => {
    const pairs = [[4, 5], [5, 4], [2, 7], [4, 3], [5, 2], [2, 5], [5, 8], [8, 5], [7, 4], [5, 6], [3, 8], [2, 3]] as const;
    const [a, b] = pick(rng, pairs);
    const res = rat(b, a);
    return {
      text: `Найдите значение выражения 1 : (${hlRaw(a, b)}).`,
      question: 'Ответ запишите дробью.',
      answer: canon(res), expr: `1 / ${R(a, b)}`, display: 'fraction',
      hint: 'Единица, делённая на дробь, — это перевёрнутая дробь: 1 : (a/b) = b/a.',
      steps: [`1 : ${a}/${b} = ${b}/${a}${res.d === 1 ? ` = ${show(res)}` : ''}`],
      wrong: [wrong(rat(a, b), 'wrongFormula', 'Дробь нужно перевернуть.')],
    };
  }),
  T('t6-5-unit-sum', t, 1, 'input', (rng) => {
    const pairs = [[4, 12], [5, 20], [6, 9], [3, 6], [8, 4], [10, 5], [15, 5], [8, 12], [7, 14], [6, 4], [3, 12], [9, 18]] as const;
    const [a, b] = pick(rng, pairs);
    const res = add(rat(1, a), rat(1, b));
    return {
      text: `Найдите значение выражения ${hlRaw(1, a)} + ${hlRaw(1, b)}.`,
      question: 'Ответ запишите несократимой дробью.',
      answer: canon(res), expr: `${R(1, a)} + ${R(1, b)}`, display: 'fraction',
      hint: `Общий знаменатель — ${(a * b) / gcdSmall(a, b)}.`,
      steps: [`1/${a} + 1/${b} = ${frac(res)}`],
      wrong: [wrong(rat(2, a + b), 'wrongFormula', 'Нельзя складывать знаменатели: 1/a + 1/b ≠ 2/(a + b).')],
    };
  }),
  T('t6-5-complex', t, 2, 'input', (rng) => {
    const pairs = [[3, 6], [4, 12], [2, 3], [2, 6], [5, 20], [3, 12], [8, 24], [2, 8], [20, 30], [14, 21]] as const;
    const [a, b] = pick(rng, pairs);
    const s = add(rat(1, a), rat(1, b));
    const res = div(rat(1), s);
    return {
      text: `Найдите значение выражения 1 : (${hlRaw(1, a)} + ${hlRaw(1, b)}).`,
      question: 'Запишите ответ числом.',
      answer: canon(res), expr: `1 / (${R(1, a)} + ${R(1, b)})`,
      hint: 'Сначала сложите дроби в скобках, затем разделите 1 на результат.',
      steps: [`1/${a} + 1/${b} = ${frac(s)}`, `1 : ${frac(s)} = ${show(res)}`],
      wrong: [wrong(s, 'wrongFormula', 'Найдена только сумма в скобках; нужно ещё разделить 1 на неё.')],
    };
  }),
  T('t6-5-complex-hard', t, 3, 'input', (rng) => {
    const pairs = [[15, 10], [21, 28], [12, 18], [20, 12], [16, 24], [9, 6], [35, 14], [18, 27], [24, 36], [25, 15]] as const;
    const [a, b] = pick(rng, pairs);
    const s = add(rat(1, a), rat(1, b));
    const res = div(rat(1), s);
    return {
      text: `Найдите значение выражения 1 : (${hlRaw(1, a)} + ${hlRaw(1, b)}).`,
      question: 'Запишите ответ числом.',
      answer: canon(res), expr: `1 / (${R(1, a)} + ${R(1, b)})`,
      hint: `Общий знаменатель — ${(a * b) / gcdSmall(a, b)}. Затем 1 разделите на сумму.`,
      steps: [`1/${a} + 1/${b} = ${frac(s)}`, `1 : ${frac(s)} = ${frac(res)} = ${show(res)}`],
      wrong: [wrong(s, 'wrongFormula', 'Найдена только сумма в скобках.'), wrong(rat(a + b), 'wrongFormula', '1 : (1/a + 1/b) не равно a + b.')],
    };
  }),

  // ---- 6.6 percentages ----
  T('t6-6-percent-of', t, 0, 'input', (rng) => {
    const p = pick(rng, [10, 20, 25, 50]);
    const n = randInt(rng, 2, 30) * 20;
    return {
      text: `Найдите ${hl(p)}% от числа ${hl(n)}.`,
      question: 'Запишите ответ числом.',
      answer: String((n * p) / 100), expr: `${n} * ${p} / 100`,
      hint: `${p}% — это ${p === 50 ? 'половина' : p === 25 ? 'четверть' : p === 20 ? 'пятая часть' : 'десятая часть'} числа.`,
      steps: [`${n} · ${p} : 100 = ${show((n * p) / 100)}`],
      wrong: [wrong(n * p, 'decimal', 'Забыли разделить на 100.')],
    };
  }),
  T('t6-6-part', t, 1, 'input', (rng) => {
    const p = pick(rng, [5, 15, 30, 40, 60, 75]);
    const n = randInt(rng, 2, 40) * 20;
    const res = (n * p) / 100;
    return {
      text: `В школьной библиотеке ${hl(n)} книг, ${hl(p)}% из них — учебники.`,
      question: 'Сколько учебников в библиотеке?',
      answer: String(res), expr: `${n} * ${p} / 100`,
      hint: `Чтобы найти ${p}% от числа, умножьте его на ${p} и разделите на 100.`,
      steps: [`${show(n)} · ${p} : 100 = ${show(res)}`],
      wrong: [wrong(n - res, 'wrongFormula', 'Найдено то, что осталось, а не сама часть.')],
    };
  }),
  T('t6-6-discount', t, 2, 'choice', (rng) => {
    const p = pick(rng, [10, 15, 20, 25, 30, 40]);
    const n = randInt(rng, 3, 60) * 100;
    const res = (n * (100 - p)) / 100;
    return {
      text: `Цена куртки снизилась на ${hl(p)}%. Сколько стала стоить куртка, если сначала она стоила ${hl(n)} ${unit}?`,
      question: 'Выберите новую цену.',
      answer: String(res), expr: `${n} * (100 - ${p}) / 100`, unit,
      hint: `После скидки ${p}% остаётся ${100 - p}% цены.`,
      steps: [`Остаётся 100% − ${p}% = ${100 - p}%`, `${show(n)} × ${show((100 - p) / 100)} = ${show(res)} ${unit}`],
      wrong: [
        wrong((n * p) / 100, 'wrongFormula', 'Это размер скидки, а не новая цена.'),
        wrong((n * (100 + p)) / 100, 'sign', 'Цену уменьшили, а не увеличили.'),
        wrong(n - p, 'wrongFormula', 'Проценты нельзя вычитать из суммы напрямую.'),
      ],
    };
  }),
  T('t6-6-up-down', t, 3, 'input', (rng) => {
    const p = pick(rng, [10, 20, 25, 50]);
    const n = randInt(rng, 1, 30) * 400;
    const up = (n * (100 + p)) / 100;
    const res = (up * (100 - p)) / 100;
    return {
      text: `Товар стоил ${hl(n)} ${unit} Сначала цену подняли на ${hl(p)}%, затем снизили на ${hl(p)}%.`,
      question: 'Сколько у.е. стоит товар теперь?',
      answer: String(res), expr: `${n} * (100 + ${p}) / 100 * (100 - ${p}) / 100`, unit,
      hint: 'Второй процент считают уже от новой цены, а не от исходной.',
      steps: [`После подорожания: ${show(n)} × ${show((100 + p) / 100)} = ${show(up)}`, `После скидки: ${show(up)} × ${show((100 - p) / 100)} = ${show(res)} ${unit}`],
      wrong: [wrong(n, 'wrongFormula', 'Проценты считаются от разных сумм, поэтому цена не вернулась к исходной.')],
    };
  }),
];

function gcdSmall(a: number, b: number): number {
  return b ? gcdSmall(b, a % b) : a;
}
