import { useLiveQuery } from 'dexie-react-hooks';
import { Bell, BookOpen, Layers, ListChecks, Target, TrendingUp, Zap } from 'lucide-react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Page } from '@/components/layout/AppShell.tsx';
import { IconButton, TopBar } from '@/components/layout/TopBar.tsx';
import { Section } from '@/components/primitives/Card.tsx';
import { ProgressBar } from '@/components/primitives/ProgressBar.tsx';
import { SectionPath } from '@/components/topic/SectionPath.tsx';
import { TrainerCard } from '@/components/topic/TrainerCard.tsx';
import { formulaProgress } from '@/data/cards.ts';
import { topicById } from '@/data/topics.ts';
import { useTopicStates } from '@/hooks/data.ts';
import { completion, MASTERED } from '@/lib/completion.ts';
import { plural } from '@/lib/format.ts';
import { ConceptCard } from './ConceptCard.tsx';

export default function TopicHubPage() {
  const { topicId = '' } = useParams();
  const navigate = useNavigate();
  const topic = topicById(topicId);
  const state = useTopicStates()[topicId];
  const cards = useLiveQuery(() => formulaProgress(topicId), [topicId], { learned: 0, total: 0 });
  if (!topic) return <Navigate to="/topics" replace />;

  const mastery = state?.mastery ?? 0;
  const conceptRead = state?.conceptRead ?? false;
  const done = completion(conceptRead, cards.learned, cards.total, mastery);
  const pct = Math.round(done * 100);

  return (
    <Page wide>
      <TopBar
        title={`Задание ${topic.number}: ${topic.short}`}
        backTo="/topics"
        right={
          <IconButton label="Напоминания" onClick={() => navigate('/settings')}>
            <Bell size={20} aria-hidden="true" />
          </IconButton>
        }
      />

      <section className="mt-4" aria-label="Прогресс по теме">
        <p className="num font-display text-[44px] leading-none font-bold">{pct}%</p>
        <p className="mt-1 text-[15px] text-muted">тема пройдена</p>
        <ProgressBar value={done} label={`Тема пройдена на ${pct}%`} className="mt-4" height={10} />
        <p className="mt-2 text-sm text-muted">
          Формулы: {cards.learned} из {cards.total} {plural(cards.total, ['карточки', 'карточек', 'карточек'])}
        </p>
      </section>

      <Section title="Путь по секциям">
        <SectionPath
          nodes={[
            { label: 'Понятие', done: conceptRead },
            { label: 'Формулы', done: cards.total > 0 && cards.learned === cards.total },
            { label: 'Задачи', done: mastery >= MASTERED },
          ]}
        />
      </Section>

      {!conceptRead && <ConceptCard topicId={topic.id} text={topic.concept} />}

      <Section title="Решения и тренажёры">
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <li>
            <TrainerCard icon={Layers} title="Формулы на карточках" description="Повторение с интервалами" to={`/topics/${topic.id}/cards`} color="#EC4899" />
          </li>
          <li>
            <TrainerCard icon={Target} title="Умный тренажёр" description="Задачи под твой уровень" to={`/practice?topic=${topic.id}`} color="#A855F7" />
          </li>
          {topic.guided && (
            <li>
              <TrainerCard icon={ListChecks} title="Разбор задачи" description="Решаем по шагам" to={`/topics/${topic.id}/task`} color="#A3E635" />
            </li>
          )}
          <li>
            <TrainerCard icon={Zap} title="Основа" description="Самые простые шаги, если тема даётся трудно" to={`/practice?topic=${topic.id}&level=0`} color="#22D3EE" />
          </li>
          <li>
            <TrainerCard icon={Zap} title="Базовые задачи" description="Разминка и уверенность" to={`/practice?topic=${topic.id}&level=1`} color="#22D3EE" />
          </li>
          <li>
            <TrainerCard icon={TrendingUp} title="Сложные задачи" description="Для тех, кто готов" to={`/practice?topic=${topic.id}&level=3`} color="#FB923C" />
          </li>
          <li>
            <TrainerCard icon={BookOpen} title="Справочник по теме" description="Понятия, связи, твои заметки" to={`/handbook?topic=${topic.id}`} color="#FACC15" />
          </li>
        </ul>
      </Section>
    </Page>
  );
}
