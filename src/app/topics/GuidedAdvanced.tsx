import { useState } from 'react';
import { Button } from '@/components/primitives/Button.tsx';
import { NumericField } from '@/components/primitives/NumericField.tsx';
import { ConfirmBar, FormulaHintCard, LiveCheck } from '@/components/task/TaskParts.tsx';
import { guidedAsTask, UNIT, type GuidedProblem } from '@/data/guided.ts';
import { recordAnswer } from '@/data/progress.ts';
import { show } from '../../../content/helpers.ts';
import { parseRational, sameValue, toNumber } from '@/lib/rational.ts';

interface Props {
  problem: GuidedProblem;
  onNext: () => void;
}

/** Step 2: the formula is given; the multiplier updates live from the entered percent. */
export function GuidedAdvanced({ problem, onNext }: Props) {
  const [percent, setPercent] = useState('');
  const [answer, setAnswer] = useState('');
  const [saved, setSaved] = useState(false);

  const p = parseRational(percent.replace('%', ''));
  const okPercent = sameValue(percent.replace('%', ''), String(problem.percent));
  const multiplier = p ? show(Math.round((1 - toNumber(p) / 100) * 1e6) / 1e6) : '…';
  const okAnswer = okPercent && sameValue(answer, String(problem.newPrice));
  const answerState = !answer ? null : okAnswer;

  const finish = async () => {
    if (!saved) {
      setSaved(true);
      await recordAnswer(guidedAsTask(problem), answer, 'guided');
    }
    onNext();
  };

  return (
    <div className="space-y-4">
      <FormulaHintCard note="Формула скидки" formula="Новая цена = старая − (старая × %)" />

      <NumericField label="Старая цена" value={show(problem.oldPrice)} onChange={() => {}} unit={UNIT} readOnly />
      <div>
        <NumericField
          label="Процент: скидка"
          value={percent}
          onChange={setPercent}
          unit="%"
          placeholder="?"
          state={!percent ? 'idle' : okPercent ? 'valid' : 'invalid'}
        />
        <LiveCheck
          ok={percent ? okPercent : null}
          okText={`Остаётся ${100 - problem.percent}% цены — множитель ${show(problem.multiplier)}`}
          badText="Сверьте процент с условием задачи."
        />
      </div>
      <div>
        <NumericField
          label={`Новая цена = ${show(problem.oldPrice)} × ${multiplier}`}
          value={answer}
          onChange={setAnswer}
          unit={UNIT}
          placeholder="?"
          state={answerState === null ? 'idle' : answerState ? 'valid' : 'invalid'}
        />
        <LiveCheck
          ok={answerState}
          okText="Сходится с формулой."
          badText={okPercent ? 'Пересчитайте произведение.' : 'Сначала исправьте процент.'}
        />
      </div>

      <ConfirmBar show={okAnswer}>Верно!</ConfirmBar>

      <div className="space-y-2 pt-1">
        <Button full disabled={!okAnswer} onClick={() => void finish()}>
          Правильно — новая задача
        </Button>
        <Button variant="ghost" full onClick={onNext}>
          Дальше
        </Button>
      </div>
    </div>
  );
}
