import { useLiveQuery } from 'dexie-react-hooks';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Page } from '@/components/layout/AppShell.tsx';
import { ProgressBar } from '@/components/primitives/ProgressBar.tsx';
import { TopicIcon } from '@/components/primitives/TopicIcon.tsx';
import { db } from '@/data/db.ts';
import { topics } from '@/data/topics.ts';
import { useTopicStates } from '@/hooks/data.ts';
import { completion } from '@/lib/completion.ts';

export default function TopicsPage() {
  const states = useTopicStates();
  const learned = useLiveQuery(
    async () => new Set((await db.cards.toArray()).filter((c) => c.reps > 0).map((c) => c.id)),
    [],
    new Set<string>(),
  );

  return (
    <Page wide>
      <h1 className="pt-8 font-display text-2xl font-bold">Темы</h1>
      <p className="mt-1 text-[15px] text-muted">Выбери тему: понятие, формулы и задачи — по шагам.</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {topics.map((t) => {
          const s = states[t.id];
          const cardsLearned = t.formulas.filter((f) => learned.has(f.id)).length;
          const done = completion(s?.conceptRead ?? false, cardsLearned, t.formulas.length, s?.mastery ?? 0);
          return (
            <li key={t.id}>
              <Link to={`/topics/${t.id}`} className="flex items-center gap-4 rounded-inner bg-surface p-4 shadow-glow transition-shadow hover:shadow-glow-strong">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-violet/15 text-[#d8b4fe]">
                  <TopicIcon name={t.icon} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex justify-between gap-2">
                    <span className="font-semibold">{t.title}</span>
                    <span className="num font-mono text-sm text-muted">{Math.round(done * 100)}%</span>
                  </span>
                  <ProgressBar value={done} label={`${t.title}: пройдено ${Math.round(done * 100)}%`} height={6} className="mt-2" />
                </span>
                <ChevronRight size={18} className="text-faint" aria-hidden="true" />
              </Link>
            </li>
          );
        })}
      </ul>
    </Page>
  );
}
