import { useLiveQuery } from 'dexie-react-hooks';
import { Flame, Layers, Route as RouteIcon, Snowflake, Sparkles, Target } from 'lucide-react';
import { Page } from '@/components/layout/AppShell.tsx';
import { Avatar } from '@/components/primitives/Avatar.tsx';
import { ButtonLink } from '@/components/primitives/Button.tsx';
import { Card, Section } from '@/components/primitives/Card.tsx';
import { ProgressBar } from '@/components/primitives/ProgressBar.tsx';
import { TopicProgressRow } from '@/components/topic/TopicProgressRow.tsx';
import { PredictedScoreWidget } from '@/components/widgets/PredictedScoreWidget.tsx';
import { dueCards } from '@/data/cards.ts';
import { BLOCK_LABEL, BLOCKS, QUICK_MAX } from '@/data/quickDiagnostic.ts';
import { challengeProgress } from '@/data/stats.ts';
import { topics } from '@/data/topics.ts';
import { usePrediction, useProfile, useTopicStates } from '@/hooks/data.ts';
import { usePlan } from '@/hooks/plan.ts';
import { LEVEL_NAMES } from '@/components/plan/LevelLadder.tsx';
import { toLocalDate } from '@/lib/dates.ts';
import { plural } from '@/lib/format.ts';
import { currentStreak, levelFromXp, TIER_LABELS, tierFromXp } from '@/lib/gamification.ts';

export default function HomePage() {
  const profile = useProfile();
  const prediction = usePrediction();
  const states = useTopicStates();
  const allDue = useLiveQuery(() => dueCards(), [], []);
  // Reviews are cards seen before; never-seen cards are offered as "new" instead.
  const due = allDue.filter((c) => c.state.reps > 0 || c.state.lapses > 0);
  const fresh = allDue.length - due.length;
  const { level, current, next } = levelFromXp(profile.xp);
  const streak = currentStreak(profile, toLocalDate());
  const challenge = challengeProgress(profile);
  const hasData = profile.diagnostic !== null;
  const plan = usePlan();
  const quick = profile.quickDiagnostic ?? null;
  const weakest = [...topics].sort((a, b) => (states[a.id]?.mastery ?? 0) - (states[b.id]?.mastery ?? 0)).slice(0, 5);

  return (
    <Page wide>
      <header className="flex items-center gap-4 pt-8">
        <Avatar name={profile.name} size={48} />
        <div className="min-w-0 flex-1">
          <p className="text-sm text-muted">
            Уровень {level} · {TIER_LABELS[tierFromXp(profile.xp)]}
          </p>
          <h1 className="truncate font-display text-xl font-bold">Привет, {profile.name}!</h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-orange/15 px-3 py-1.5 text-orange" aria-label={`Стрик: ${streak} ${plural(streak, ['день', 'дня', 'дней'])}`}>
          <Flame size={18} aria-hidden="true" />
          <span className="num font-display font-bold">{streak}</span>
        </div>
      </header>
      <ProgressBar value={current / next} label={`До уровня ${level + 1}: ${current} из ${next} XP`} className="mt-4" height={6} />
      <p className="mt-1.5 text-right text-xs text-muted">
        {current} / {next} XP до уровня {level + 1}
      </p>

      {plan && (
        <Card as="section" aria-label="План на сегодня" glow="strong" className="mt-6 p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-violet/20 text-[#d8b4fe]">
                <RouteIcon size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 className="font-display text-base font-semibold">План на сегодня</h2>
                <p className="text-sm text-muted">
                  {plan.today.filter((b) => b.done >= b.count).length} из {plan.today.length} блоков · освоено {plan.mastered} из {plan.total}
                </p>
              </div>
            </div>
            <ButtonLink to="/plan" variant="pill">Открыть</ButtonLink>
          </div>
          <ul className="mt-4 flex flex-wrap gap-2">
            {plan.today.map((b) => (
              <li key={`${b.kind}-${b.topicId}`} className={`rounded-full px-3 py-1 text-sm ${b.done >= b.count ? 'bg-lime/15 text-lime' : 'bg-white/8 text-ink'}`}>
                {b.kind === 'cards' ? 'Формулы' : `№${b.number} · ${LEVEL_NAMES[b.level]}`}
              </li>
            ))}
          </ul>
        </Card>
      )}

      {quick && (
        <Card as="section" aria-label="Стартовый тест" className="mt-4 p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-yellow/15 text-yellow">
              <Sparkles size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="font-display text-base font-semibold">Стартовый тест</h2>
              <p className="text-sm text-muted">
                Балл по шкале первой части · пройден {new Date(quick.takenAt).toLocaleDateString('ru-RU')}{hasData ? ' · план строится по полной диагностике' : ''}
              </p>
            </div>
            <p className="num shrink-0 font-display text-[32px] leading-none font-bold" aria-label={`Стартовый балл ${quick.score} из ${QUICK_MAX}`}>
              {quick.score}
              <span className="text-base text-faint">/{QUICK_MAX}</span>
            </p>
          </div>
          <ul className="mt-3 flex flex-wrap items-center gap-2" aria-label="По блокам">
              {BLOCKS.filter((b) => quick.blocks[b]).map((b) => (
                <li key={b} className={`rounded-full px-3 py-1 text-xs ${quick.blocks[b]!.correct === quick.blocks[b]!.total ? 'bg-lime/15 text-lime' : quick.blocks[b]!.correct ? 'bg-yellow/15 text-yellow' : 'bg-pink/15 text-pink'}`}>
                  {BLOCK_LABEL[b]}
                </li>
              ))}
            <li>
              <ButtonLink to="/start" variant="ghost" className="min-h-7 px-2 text-xs">Пройти ещё раз</ButtonLink>
            </li>
          </ul>
        </Card>
      )}

      <Card as="section" aria-label="Полная диагностика" className="mt-4 flex flex-wrap items-center gap-4 p-5 sm:p-6">
        <span className="grid size-10 place-items-center rounded-xl bg-lime/15 text-lime">
          <Target size={20} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-semibold">Полная диагностика</h2>
          <p className="text-sm text-muted">
            {hasData
              ? `19 заданий без таймера. В прошлый раз: прогноз ${profile.diagnostic?.predicted} из ${profile.diagnostic?.max}. Пройди снова, чтобы увидеть, что изменилось.`
              : '19 заданий, по одному на каждый номер, без таймера. Необязательно, но после неё план и прогноз станут точнее.'}
          </p>
        </div>
        <ButtonLink to="/diagnostic" variant={hasData ? 'soft' : 'pill'} className="basis-full sm:basis-auto">{hasData ? 'Пройти снова' : 'Пройти'}</ButtonLink>
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <PredictedScoreWidget prediction={prediction} hasData={hasData} />

        <Card as="section" aria-label="Повторение" className="flex flex-col justify-between gap-4 p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-pink/15 text-pink">
              <Layers size={20} aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-display text-base font-semibold">Формулы на повтор</h2>
              <p className="mt-1 text-[15px] text-muted">
                {due.length
                  ? `${due.length} ${plural(due.length, ['карточка ждёт', 'карточки ждут', 'карточек ждут'])} повторения`
                  : fresh
                    ? `Повторять пока нечего. Новых формул: ${fresh}`
                    : 'На сегодня всё повторено'}
              </p>
            </div>
          </div>
          {allDue[0] && (
            <ButtonLink to={`/topics/${(due[0] ?? allDue[0]).def.topicId}/cards`} variant="soft" className="self-start">
              {due.length ? 'Повторить' : 'Учить формулы'}
            </ButtonLink>
          )}
        </Card>
      </div>

      <Section title="Вызов «100 дней»">
        <Card className="p-5">
          <div className="flex items-center justify-between text-[15px]">
            <span>
              Активных дней: <strong className="num">{challenge.done}</strong> из {challenge.total}
            </span>
            <span className="flex items-center gap-1.5 text-sm text-cyan" title="Заморозки спасают стрик, если пропустить день">
              <Snowflake size={16} aria-hidden="true" /> {profile.freezes} {plural(profile.freezes, ['заморозка', 'заморозки', 'заморозок'])}
            </span>
          </div>
          <ProgressBar value={challenge.done / challenge.total} color="#22D3EE" label="Вызов 100 дней" className="mt-3" />
        </Card>
      </Section>

      <Section title="Самые слабые задания" action={<ButtonLink to="/plan" variant="ghost" className="min-h-9 px-3 text-sm">Все 19</ButtonLink>}>
        <Card className="space-y-1 p-4 sm:p-5">
          {weakest.map((t) => (
            <TopicProgressRow key={t.id} title={`${t.number}. ${t.short}`} value={states[t.id]?.mastery ?? 0} to={`/topics/${t.id}`} />
          ))}
        </Card>
      </Section>
    </Page>
  );
}
