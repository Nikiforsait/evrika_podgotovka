import { Card } from '@/components/primitives/Card.tsx';
import type { LearningPlan } from '@/lib/plan.ts';

const DAY = new Intl.DateTimeFormat('ru-RU', { weekday: 'short', day: 'numeric' });

/** Seven columns: which task numbers the plan schedules for each day. */
export function WeekMap({ plan }: { plan: LearningPlan }) {
  const numberOf = (id: string) => plan.topics.find((t) => t.id === id)?.number ?? '?';
  return (
    <Card className="p-4 sm:p-5">
      <ol className="grid grid-cols-7 gap-2">
        {plan.week.map((day, i) => (
          <li key={day.date} className="flex flex-col items-center gap-2">
            <span className={`text-xs ${i === 0 ? 'font-bold text-ink' : 'text-muted'}`}>{i === 0 ? 'Сегодня' : DAY.format(new Date(day.date))}</span>
            <div className="flex w-full flex-col gap-1">
              {day.topicIds.map((id) => (
                <span
                  key={id}
                  className={`num grid h-8 place-items-center rounded-lg text-sm font-semibold ${i === 0 ? 'bg-selected text-white' : 'bg-violet/15 text-[#d8b4fe]'}`}
                  title={plan.topics.find((t) => t.id === id)?.title}
                >
                  {numberOf(id)}
                </span>
              ))}
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-sm text-muted">Номера заданий по дням. План пересчитывается после каждой тренировки, так что дальние дни могут меняться.</p>
    </Card>
  );
}
