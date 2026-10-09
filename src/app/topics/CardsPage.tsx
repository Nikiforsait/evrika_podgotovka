import { motion } from 'framer-motion';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { Page } from '@/components/layout/AppShell.tsx';
import { TopBar } from '@/components/layout/TopBar.tsx';
import { Button, ButtonLink } from '@/components/primitives/Button.tsx';
import { Card } from '@/components/primitives/Card.tsx';
import { dueCards, gradeCard } from '@/data/cards.ts';
import { topicById } from '@/data/topics.ts';
import { previewIntervals, type Grade } from '@/lib/srs.ts';
import { plural } from '@/lib/format.ts';

const GRADES: { grade: Grade; label: string; cls: string }[] = [
  { grade: 'again', label: 'Не помню', cls: 'bg-pink/20 text-[#fbcfe8]' },
  { grade: 'hard', label: 'Трудно', cls: 'bg-yellow/15 text-yellow' },
  { grade: 'good', label: 'Помню', cls: 'bg-violet/25 text-[#e9d5ff]' },
  { grade: 'easy', label: 'Легко', cls: 'bg-lime/15 text-lime' },
];

/** Formula flashcards scheduled with SM-2: show the front, reveal, self-grade. */
export default function CardsPage() {
  const { topicId = '' } = useParams();
  const topic = topicById(topicId);
  const [session] = useState(() => Date.now());
  const due = useLiveQuery(() => dueCards(topicId), [topicId, session]);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  if (!topic) return <Navigate to="/topics" replace />;
  if (!due) return <Page nav={false}><p className="mt-10 text-center text-muted" role="status">Загружаем карточки…</p></Page>;

  // `due` shrinks as cards are graded, so always show its first item.
  const card = due[0];
  const finished = !card;

  const grade = async (g: Grade) => {
    if (!card) return;
    await gradeCard(card.def.id, topicId, g);
    setRevealed(false);
    setIndex(index + 1);
  };

  return (
    <Page nav={false}>
      <TopBar title={`Формулы · ${topic.title}`} backTo={`/topics/${topicId}`} />
      {finished ? (
        <Card className="mt-8 flex flex-col items-center p-8 text-center" glow="lime">
          <CheckCircle2 size={40} className="text-lime" aria-hidden="true" />
          <h2 className="mt-3 font-display text-xl font-bold">На сегодня всё</h2>
          <p className="mt-2 text-muted">
            {index ? `Повторено ${index} ${plural(index, ['карточка', 'карточки', 'карточек'])}. ` : ''}Следующее повторение — когда подойдёт срок.
          </p>
          <ButtonLink to={`/practice?topic=${topicId}`} className="mt-6">
            Закрепить на задачах
          </ButtonLink>
        </Card>
      ) : (
        <div className="mt-6">
          <p className="mb-3 text-center text-sm text-muted">Осталось: {due.length}</p>
          <motion.div key={card.def.id + String(revealed)} initial={{ rotateY: -8, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }}>
              <Card glow="strong" className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
                <p className="font-mono text-xl font-semibold">{card.def.front}</p>
                {revealed && <p className="mt-5 border-t border-white/10 pt-5 font-mono text-lg text-lime">{card.def.back}</p>}
              </Card>
          </motion.div>
          {!revealed ? (
            <Button full className="mt-6" onClick={() => setRevealed(true)}>
              Показать ответ
            </Button>
          ) : (
            <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4" role="group" aria-label="Насколько хорошо помнишь?">
              {GRADES.map(({ grade: g, label, cls }) => {
                const days = previewIntervals(card.state)[g];
                return (
                  <button key={g} type="button" onClick={() => void grade(g)} className={`flex min-h-16 flex-col items-center justify-center rounded-inner font-semibold ${cls}`}>
                    {label}
                    <span className="text-xs font-normal opacity-80">через {days} {plural(days, ['день', 'дня', 'дней'])}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </Page>
  );
}
