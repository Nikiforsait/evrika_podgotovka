import { useState } from 'react';
import { Button } from '@/components/primitives/Button.tsx';
import { NumericField, type FieldState } from '@/components/primitives/NumericField.tsx';
import { ConfirmBar, TaskCard } from '@/components/task/TaskParts.tsx';
import { problemText, UNIT, type GuidedProblem } from '@/data/guided.ts';
import { show } from '../../../content/helpers.ts';
import { sameValue } from '@/lib/rational.ts';

interface Props {
  problem: GuidedProblem;
  onNext: () => void;
}

/** Step 1: write down the givens, then compute the new price. */
export function GuidedIntermediate({ problem, onNext }: Props) {
  const [oldPrice, setOldPrice] = useState('');
  const [percent, setPercent] = useState('');
  const [answer, setAnswer] = useState('');
  const [checked, setChecked] = useState(false);

  const okOld = sameValue(oldPrice, String(problem.oldPrice));
  const okPercent = sameValue(percent.replace('%', ''), String(problem.percent));
  const okAnswer = sameValue(answer, String(problem.newPrice));
  const allOk = okOld && okPercent && okAnswer;
  const state = (filled: string, ok: boolean): FieldState => (!checked || !filled ? 'idle' : ok ? 'valid' : 'invalid');

  return (
    <div className="space-y-4">
      <TaskCard text={problemText(problem)} />

      <NumericField
        label="Старая цена"
        value={oldPrice}
        onChange={setOldPrice}
        unit={UNIT}
        placeholder="?"
        state={state(oldPrice, okOld)}
        message={checked && oldPrice && !okOld ? 'Найдите начальную стоимость в условии.' : undefined}
      />
      <NumericField
        label="Процент скидки"
        value={percent}
        onChange={setPercent}
        unit="%"
        placeholder="?"
        state={state(percent, okPercent)}
        message={checked && percent && !okPercent ? 'На сколько процентов снизилась цена?' : undefined}
      />

      <section aria-label="Ответ" className="rounded-card bg-surface p-5 shadow-glow">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-[15px] text-muted sm:text-base">
            Новая цена = {okOld ? show(problem.oldPrice) : 'старая'} × {okPercent ? show(problem.multiplier) : '(1 − p/100)'}
          </p>
          <NumericField
            label="Ответ"
            value={answer}
            onChange={setAnswer}
            unit={UNIT}
            placeholder="?"
            state={state(answer, okAnswer)}
            message={checked && answer && !okAnswer ? 'Пересчитайте произведение по формуле выше.' : undefined}
            className="w-full sm:w-auto"
          />
        </div>
      </section>

      <ConfirmBar show={checked && allOk}>Правильно</ConfirmBar>

      <div className="space-y-2 pt-1">
        {checked && allOk ? (
          <Button full onClick={onNext}>
            Следующий шаг
          </Button>
        ) : (
          <Button full disabled={!oldPrice || !percent || !answer} onClick={() => setChecked(true)}>
            Проверить
          </Button>
        )}
        <Button variant="ghost" full onClick={onNext}>
          Дальше
        </Button>
      </div>
    </div>
  );
}
