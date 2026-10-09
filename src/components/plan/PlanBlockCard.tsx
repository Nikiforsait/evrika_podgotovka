import { CheckCircle2, Layers, Target } from 'lucide-react';
import type { PlanBlock } from '@/lib/plan.ts';
import { ButtonLink } from '../primitives/Button.tsx';
import { Card } from '../primitives/Card.tsx';
import { ProgressBar } from '../primitives/ProgressBar.tsx';
import { LEVEL_NAMES } from './LevelLadder.tsx';

/** One block of today's lesson: a topic at a level, or formula cards to review. */
export function PlanBlockCard({ block, index }: { block: PlanBlock; index: number }) {
  const finished = block.done >= block.count;
  const isCards = block.kind === 'cards';
  const to = isCards ? `/topics/${block.topicId}/cards` : `/practice?topic=${block.topicId}&level=${block.level}&count=${block.count}&from=plan`;
  return (
    <Card glow={finished ? 'lime' : index === 0 ? 'strong' : 'default'} className="flex items-center gap-4 p-4 sm:p-5">
      <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${finished ? 'bg-lime/15 text-lime' : 'bg-violet/15 text-[#d8b4fe]'}`}>
        {finished ? <CheckCircle2 size={22} aria-hidden="true" /> : isCards ? <Layers size={22} aria-hidden="true" /> : <Target size={22} aria-hidden="true" />}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] text-muted">{isCards ? 'Повторение формул' : `Задание ${block.number} · ${LEVEL_NAMES[block.level]}`}</p>
        <h3 className="truncate text-[16px] font-semibold">{isCards ? `${block.count} карточек ждут повторения` : block.title}</h3>
        {!isCards && (
          <div className="mt-2 flex items-center gap-3">
            <ProgressBar value={block.done / block.count} label={`Решено ${block.done} из ${block.count}`} height={4} className="flex-1" color={finished ? '#A3E635' : undefined} />
            <span className="num text-xs text-muted">{block.done}/{block.count}</span>
          </div>
        )}
      </div>
      <ButtonLink to={to} variant={finished ? 'ghost' : 'pill'} className="shrink-0">
        {finished ? 'Ещё' : block.done > 0 ? 'Продолжить' : 'Начать'}
      </ButtonLink>
    </Card>
  );
}
