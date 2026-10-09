// Task 12: evaluating and rearranging formulas.
import { pick, randInt } from '../../src/lib/rng.ts';
import { canon, hl, show, T, wrong } from '../helpers.ts';
import type { TaskTemplate } from '../types.ts';

const t = 't12';

export const t12: TaskTemplate[] = [
  T('t12-0-substitute', t, 0, 'input', (rng) => {
    const F = randInt(rng, 2, 50) * 10;
    const h = randInt(rng, 2, 9);
    return {
      text: `Потенциальная энергия тела (в джоулях) вычисляется по формуле P = F·h, где F — сила тяжести в ньютонах, h — высота в метрах.`,
      question: `Найдите P, если F = ${hl(F)} Н, h = ${hl(h)} м.`,
      answer: String(F * h), expr: `${F} * ${h}`, unit: 'Дж',
      hint: 'Подставьте числа в формулу и перемножьте.',
      steps: [`P = ${F} · ${h} = ${F * h} Дж`],
      wrong: [wrong(F + h, 'wrongFormula', 'В формуле произведение, а не сумма.')],
    };
  }),
  T('t12-1-divide', t, 1, 'input', (rng) => {
    const kind = randInt(rng, 0, 1);
    if (kind === 0) {
      const F = randInt(rng, 2, 50) * 10;
      const h = randInt(rng, 2, 9);
      return {
        text: `Потенциальная энергия тела (в джоулях) вычисляется по формуле P = F·h, где F — сила тяжести в ньютонах, h — высота в метрах.`,
        question: `Найдите силу тяжести F, если P = ${hl(F * h)} Дж, h = ${hl(h)} м. Ответ дайте в ньютонах.`,
        answer: String(F), expr: `${F * h} / ${h}`, unit: 'Н',
        hint: 'Выразите F из формулы: F = P : h.',
        steps: [`F = P : h = ${F * h} : ${h} = ${F} Н`],
        wrong: [wrong(F * h * h, 'wrongFormula', 'Чтобы найти множитель, делят, а не умножают.')],
      };
    }
    const v = randInt(rng, 3, 25) * 4;
    const time = randInt(rng, 2, 9);
    return {
      text: `Путь при равномерном движении вычисляется по формуле S = v·t, где v — скорость в км/ч, t — время в часах.`,
      question: `Найдите время t, если S = ${hl(v * time)} км, v = ${hl(v)} км/ч. Ответ дайте в часах.`,
      answer: String(time), expr: `${v * time} / ${v}`, unit: 'ч',
      hint: 'Выразите t из формулы: t = S : v.',
      steps: [`t = ${v * time} : ${v} = ${time} ч`],
      wrong: [wrong(v * time * v, 'wrongFormula', 'Время находят делением пути на скорость.')],
    };
  }),
  T('t12-2-g', t, 2, 'input', (rng) => {
    const kind = randInt(rng, 0, 1);
    if (kind === 0) {
      const m = randInt(rng, 2, 40) * 5;
      const h = randInt(rng, 2, 9);
      const P = 9.8 * m * h;
      return {
        text: `Потенциальная энергия тела массой m кг на высоте h м вычисляется по формуле P = m·g·h, где g = 9,8 м/с².`,
        question: `Найдите массу тела, подвешенного на высоте ${hl(h)} м, если его потенциальная энергия равна ${hl(P)} Дж. Ответ дайте в килограммах.`,
        answer: String(m), expr: `Rational(${Math.round(P * 10)}, 10) / (Rational(98, 10) * ${h})`, unit: 'кг',
        hint: 'Выразите m: m = P : (g·h).',
        steps: [`g·h = 9,8 · ${h} = ${show(9.8 * h)}`, `m = ${show(P)} : ${show(9.8 * h)} = ${m} кг`],
        wrong: [wrong(Math.round((P / 9.8) * 100) / 100, 'wrongFormula', 'Нужно разделить и на g, и на h.')],
      };
    }
    const c = pick(rng, [4200, 500, 400, 900]);
    const m = pick(rng, [2, 3, 5, 10]);
    const dt = randInt(rng, 5, 40);
    const Q = c * m * dt;
    return {
      text: `Количество теплоты (в джоулях) вычисляется по формуле Q = c·m·Δt, где c — удельная теплоёмкость, m — масса в кг, Δt — изменение температуры в °C.`,
      question: `Найдите Δt, если Q = ${hl(Q)} Дж, c = ${hl(c)} Дж/(кг·°C), m = ${hl(m)} кг.`,
      answer: String(dt), expr: `${Q} / (${c} * ${m})`, unit: '°C',
      hint: 'Δt = Q : (c·m).',
      steps: [`c·m = ${c} · ${m} = ${c * m}`, `Δt = ${show(Q)} : ${show(c * m)} = ${dt} °C`],
      wrong: [wrong(Math.round((Q / c) * 100) / 100, 'wrongFormula', 'Делить нужно на произведение c·m.')],
    };
  }),
  T('t12-3-square', t, 3, 'input', (rng) => {
    const kind = randInt(rng, 0, 1);
    if (kind === 0) {
      const m = pick(rng, [2, 4, 5, 8, 10]);
      const v = randInt(rng, 2, 12);
      const E = (m * v * v) / 2;
      return {
        text: `Кинетическая энергия тела (в джоулях) вычисляется по формуле E = m·v²/2, где m — масса в кг, v — скорость в м/с.`,
        question: `Найдите скорость тела массой ${hl(m)} кг, если его кинетическая энергия равна ${hl(E)} Дж. Ответ дайте в м/с.`,
        answer: String(v), expr: `sqrt(2 * ${canon(E)} / ${m})`, unit: 'м/с',
        hint: 'Выразите v² = 2E : m, затем извлеките корень.',
        steps: [`v² = 2 · ${show(E)} : ${m} = ${v * v}`, `v = √${v * v} = ${v} м/с`],
        wrong: [wrong(v * v, 'wrongFormula', 'Найден квадрат скорости, корень не извлечён.')],
      };
    }
    const a = randInt(rng, 2, 12);
    const S = a * a;
    return {
      text: `Площадь квадрата со стороной a вычисляется по формуле S = a².`,
      question: `Найдите сторону квадрата, площадь которого равна ${hl(S)} см². Ответ дайте в сантиметрах.`,
      answer: String(a), expr: `sqrt(${S})`, unit: 'см',
      hint: 'Сторона — корень из площади.',
      steps: [`a = √${S} = ${a} см`],
      wrong: [wrong(S / 2, 'wrongFormula', 'Площадь квадрата — это квадрат стороны, а не удвоенная сторона.')],
    };
  }),
];
