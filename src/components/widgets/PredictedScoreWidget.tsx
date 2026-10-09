import { Dumbbell, Target } from 'lucide-react';
import type { Prediction } from '@/lib/predict.ts';
import { ButtonLink } from '../primitives/Button.tsx';
import { Card } from '../primitives/Card.tsx';
import { GaugeRing } from '../primitives/GaugeRing.tsx';

/** Dashboard widget: predicted score with its range and a training shortcut. */
export function PredictedScoreWidget({ prediction, hasData }: { prediction: Prediction; hasData: boolean }) {
  return (
    <Card as="section" aria-label="Прогноз результата" glow="strong" className="flex items-center gap-5 p-5 sm:gap-7 sm:p-6">
      <GaugeRing
        value={hasData ? prediction.score / prediction.max : 0}
        size={128}
        stroke={11}
        label={hasData ? `Прогноз ${prediction.score} из ${prediction.max}` : 'Прогноза пока нет'}
      >
        <p className="num font-display text-[28px] leading-none font-bold">
          {hasData ? prediction.score : '—'}
          <span className="text-base text-faint">/{prediction.max}</span>
        </p>
      </GaugeRing>
      <div className="min-w-0 flex-1">
        <h2 className="text-[15px] text-muted">Прогноз</h2>
        <p className="mt-1 text-[15px] leading-snug">
          {hasData
            ? `Скорее всего от ${prediction.low} до ${prediction.high} баллов. Чем больше решаешь, тем точнее.`
            : 'Пройди диагностику — и здесь появится твой прогноз.'}
        </p>
        <ButtonLink to={hasData ? '/practice' : '/diagnostic'} variant="pill" className="mt-4 min-h-11 px-5 whitespace-nowrap">
          {hasData ? <Dumbbell size={18} aria-hidden="true" /> : <Target size={18} aria-hidden="true" />}
          {hasData ? 'Тренироваться' : 'Диагностика'}
        </ButtonLink>
        {hasData && (
          <ButtonLink to="/diagnostic" variant="ghost" className="mt-1 min-h-10 px-3 text-sm">
            Пройти диагностику снова
          </ButtonLink>
        )}
      </div>
    </Card>
  );
}
