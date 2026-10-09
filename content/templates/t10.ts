// Task 10: classical probability.
import { pick, randInt } from '../../src/lib/rng.ts';
import { rat } from '../../src/lib/rational.ts';
import { canon, hl, show, T, wrong } from '../helpers.ts';
import type { TaskTemplate } from '../types.ts';

const t = 't10';
const NAMES = ['Витя', 'Оскар', 'Лена', 'Марк', 'Алиса', 'Тимур', 'Соня', 'Глеб'];
/** Totals that give a terminating decimal for most numerators. */
const TOTALS = [10, 20, 25, 40, 50, 8, 16, 32];

export const t10: TaskTemplate[] = [
  T('t10-0-balls', t, 0, 'input', (rng) => {
    const total = pick(rng, [10, 20, 25, 50]);
    const red = randInt(rng, 1, total - 1);
    return {
      text: `В коробке ${hl(total)} одинаковых на ощупь шаров, из них ${hl(red)} красных. Наугад достают один шар.`,
      question: 'Найдите вероятность того, что он красный.',
      answer: canon(rat(red, total)), expr: `Rational(${red}, ${total})`,
      hint: 'Вероятность = число благоприятных исходов : число всех исходов.',
      steps: [`P = ${red} / ${total} = ${show(rat(red, total))}`],
      wrong: [wrong(rat(total - red, total), 'wrongFormula', 'Это вероятность другого цвета.')],
    };
  }),
  T('t10-1-complement', t, 1, 'input', (rng) => {
    const kind = randInt(rng, 0, 2);
    if (kind === 0) {
      const total = pick(rng, TOTALS);
      const bad = randInt(rng, 1, total - 1);
      return {
        text: `На зачёте ${hl(total)} билетов, ${pick(rng, NAMES)} не выучил ${hl(bad)} из них.`,
        question: 'Найдите вероятность того, что ему попадётся выученный билет.',
        answer: canon(rat(total - bad, total)), expr: `Rational(${total - bad}, ${total})`,
        hint: 'Сначала найдите, сколько билетов выучено.',
        steps: [`Выучено ${total} − ${bad} = ${total - bad}`, `P = ${total - bad} / ${total} = ${show(rat(total - bad, total))}`],
        wrong: [wrong(rat(bad, total), 'wrongFormula', 'Это вероятность невыученного билета.')],
      };
    }
    if (kind === 1) {
      const p = pick(rng, [0.02, 0.05, 0.1, 0.15, 0.04, 0.08]);
      return {
        text: `Вероятность того, что новая ручка пишет плохо, равна ${hl(p)}. Покупатель выбирает одну ручку.`,
        question: 'Найдите вероятность того, что эта ручка пишет хорошо.',
        answer: canon(1 - p), expr: `1 - Rational(${Math.round(p * 100)}, 100)`,
        hint: 'События «пишет плохо» и «пишет хорошо» противоположны: их вероятности в сумме дают 1.',
        steps: [`P = 1 − ${show(p)} = ${show(1 - p)}`],
        wrong: [wrong(p, 'wrongFormula', 'Нужна вероятность противоположного события.')],
      };
    }
    const total = pick(rng, [10, 20, 40]);
    const red = randInt(rng, 2, total - 2);
    return {
      text: `У бабушки ${hl(total)} чашек: ${hl(red)} с красными цветами, остальные с синими. Чай наливают в случайно выбранную чашку.`,
      question: 'Найдите вероятность того, что это будет чашка с синими цветами.',
      answer: canon(rat(total - red, total)), expr: `Rational(${total - red}, ${total})`,
      hint: 'Сначала посчитайте синие чашки.',
      steps: [`Синих: ${total} − ${red} = ${total - red}`, `P = ${total - red} / ${total} = ${show(rat(total - red, total))}`],
      wrong: [wrong(rat(red, total), 'wrongFormula', 'Это вероятность красной чашки.')],
    };
  }),
  T('t10-2-groups', t, 2, 'input', (rng) => {
    const kind = randInt(rng, 0, 2);
    if (kind === 0) {
      const total = pick(rng, [10, 20, 25]);
      const yellow = randInt(rng, 1, 4);
      const black = randInt(rng, 1, total - yellow - 1);
      const green = total - yellow - black;
      return {
        text: `В службе такси свободно ${hl(total)} машин: ${hl(black)} чёрных, ${hl(yellow)} жёлтых и ${hl(green)} зелёных. На вызов выезжает ближайшая машина — случайная из свободных.`,
        question: 'Найдите вероятность того, что приедет жёлтое такси.',
        answer: canon(rat(yellow, total)), expr: `Rational(${yellow}, ${total})`,
        hint: 'Всего исходов — все свободные машины.',
        steps: [`P = ${yellow} / ${total} = ${show(rat(yellow, total))}`],
        wrong: [wrong(rat(yellow, total - yellow), 'wrongFormula', 'В знаменателе — все машины, включая жёлтые.')],
      };
    }
    if (kind === 1) {
      const total = pick(rng, [100, 150, 200, 250, 500]);
      const broken = pick(rng, [2, 4, 5, 6, 10, 15, 20]);
      if (broken >= total) throw new Error('retry');
      return {
        text: `В среднем из ${hl(total)} фонариков, поступивших в продажу, ${hl(broken)} неисправны.`,
        question: 'Найдите вероятность того, что случайно выбранный фонарик исправен.',
        answer: canon(rat(total - broken, total)), expr: `Rational(${total - broken}, ${total})`,
        hint: 'Исправных фонариков — всего минус неисправные.',
        steps: [`Исправных: ${total - broken}`, `P = ${total - broken} / ${total} = ${show(rat(total - broken, total))}`],
        wrong: [wrong(rat(broken, total), 'wrongFormula', 'Это вероятность неисправного фонарика.')],
      };
    }
    const total = pick(rng, [10, 20, 25]);
    const cars = randInt(rng, 2, total - 2);
    const name = pick(rng, NAMES);
    return {
      text: `Для подарков закупили ${hl(total)} пазлов: ${hl(cars)} с машинами и ${hl(total - cars)} с видами городов. Подарки случайно распределяют между ${total} детьми, среди которых ${name}.`,
      question: `Найдите вероятность того, что ${name === 'Лена' || name === 'Алиса' || name === 'Соня' ? name.replace(/а$/, 'е').replace(/я$/, 'е') : name.endsWith('р') || name.endsWith('к') || name.endsWith('б') ? `${name}у` : `${name}е`} достанется пазл с машиной.`,
      answer: canon(rat(cars, total)), expr: `Rational(${cars}, ${total})`,
      hint: 'Каждый ребёнок получает один из пазлов с равной вероятностью.',
      steps: [`P = ${cars} / ${total} = ${show(rat(cars, total))}`],
      wrong: [wrong(rat(total - cars, total), 'wrongFormula', 'Это вероятность пазла с городом.')],
    };
  }),
  T('t10-3-or', t, 3, 'input', (rng) => {
    const kind = randInt(rng, 0, 1);
    if (kind === 0) {
      const red = pick(rng, [10, 20, 30]);
      const green = pick(rng, [4, 8, 12]);
      const purple = pick(rng, [6, 12, 16]);
      const rest = pick(rng, [80, 100, 120, 160]); // blue + black, equal
      const total = red + green + purple + rest;
      const ans = rat(red + rest / 2, total);
      return {
        text: `В магазине ${hl(total)} ручек: ${hl(red)} красных, ${hl(green)} зелёных, ${hl(purple)} фиолетовых, остальные синие и чёрные, их поровну.`,
        question: 'Найдите вероятность того, что случайно выбранная ручка будет красной или синей.',
        answer: canon(ans), expr: `Rational(${red} + ${rest / 2}, ${total})`,
        hint: 'Сначала найдите число синих ручек, затем сложите благоприятные исходы.',
        steps: [`Синих и чёрных: ${total} − ${red} − ${green} − ${purple} = ${rest}, синих ${rest / 2}`, `P = (${red} + ${rest / 2}) / ${total} = ${show(ans)}`],
        wrong: [wrong(rat(red + rest, total), 'wrongFormula', 'Синих ручек — только половина оставшихся.')],
      };
    }
    const a = randInt(rng, 4, 9);
    const b = randInt(rng, 1, 3);
    const c = randInt(rng, 1, 4);
    const total = a + b + c;
    const ans = rat(b, total);
    return {
      text: `В гонке участвуют ${hl(a)} спортсменов из первой команды, ${hl(b)} из второй и ${hl(c)} из третьей. Порядок старта определяется жребием.`,
      question: 'Найдите вероятность того, что первым стартует спортсмен из второй команды.',
      answer: canon(ans), expr: `Rational(${b}, ${total})`,
      hint: 'Первым может стартовать любой из всех спортсменов с равной вероятностью.',
      steps: [`Всего спортсменов: ${total}`, `P = ${b} / ${total} = ${show(ans)}`],
      wrong: [wrong(rat(b, a + c), 'wrongFormula', 'В знаменателе — все участники, включая вторую команду.')],
    };
  }),
];
