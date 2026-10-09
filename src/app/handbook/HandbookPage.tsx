import { useLiveQuery } from 'dexie-react-hooks';
import { Printer } from 'lucide-react';
import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Page } from '@/components/layout/AppShell.tsx';
import { Button } from '@/components/primitives/Button.tsx';
import { db, type Note } from '@/data/db.ts';
import { topics } from '@/data/topics.ts';
import { TopicEntry } from './TopicEntry.tsx';

/** Dynamic handbook: concepts, formulas, topic links and notes compiled from mistakes. */
export default function HandbookPage() {
  const [params] = useSearchParams();
  const focus = params.get('topic');
  const notes = useLiveQuery(() => db.notes.orderBy('createdAt').reverse().toArray(), [], [] as Note[]);

  useEffect(() => {
    if (focus) document.getElementById(`topic-${focus}`)?.scrollIntoView({ block: 'start' });
  }, [focus]);

  return (
    <Page wide>
      <div className="flex flex-wrap items-end justify-between gap-4 pt-8">
        <div>
          <h1 className="font-display text-2xl font-bold">Справочник</h1>
          <p className="mt-1 max-w-prose text-[15px] text-muted">
            Понятия и формулы по темам, связи между ними и твои личные заметки — они собираются из ошибок автоматически.
          </p>
        </div>
        <Button variant="soft" className="no-print" onClick={() => window.print()}>
          <Printer size={18} aria-hidden="true" /> Сохранить в PDF
        </Button>
      </div>
      <p className="no-print mt-2 text-sm text-faint">В окне печати выберите «Сохранить как PDF».</p>

      <div className="mt-6 space-y-4">
        {topics.map((t) => (
          <TopicEntry key={t.id} topic={t} notes={notes.filter((n) => n.topicId === t.id)} highlighted={focus === t.id} />
        ))}
      </div>
    </Page>
  );
}
