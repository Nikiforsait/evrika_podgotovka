import { NotebookPen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card } from '@/components/primitives/Card.tsx';
import { TopicIcon } from '@/components/primitives/TopicIcon.tsx';
import type { Note } from '@/data/db.ts';
import { topicById, type Topic } from '@/data/topics.ts';
import { ERROR_LABELS } from '@/lib/errors.ts';

const LINK_KINDS = [
  { key: 'prerequisites', label: 'Опирается на' },
  { key: 'related', label: 'Связано с' },
  { key: 'specialCaseOf', label: 'Частный случай' },
] as const;

/** Collapse repeated mistakes into one note with a counter. */
function groupNotes(notes: Note[]) {
  const map = new Map<string, { note: Note; count: number }>();
  for (const n of notes) {
    const key = `${n.kind}|${n.text}`;
    const entry = map.get(key);
    if (entry) entry.count += 1;
    else map.set(key, { note: n, count: 1 });
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export function TopicEntry({ topic, notes, highlighted }: { topic: Topic; notes: Note[]; highlighted: boolean }) {
  const grouped = groupNotes(notes);
  return (
    <Card as="article" id={`topic-${topic.id}`} glow={highlighted ? 'strong' : 'default'} className="scroll-mt-6 p-5 sm:p-6">
      <h2 className="flex items-center gap-3 font-display text-lg font-semibold">
        <TopicIcon name={topic.icon} className="text-[#d8b4fe]" />
        {topic.title}
      </h2>
      <p className="mt-3 max-w-prose text-[15px] leading-relaxed text-ink/90">{topic.concept}</p>

      <dl className="mt-4 grid gap-2 sm:grid-cols-2">
        {topic.formulas.map((f) => (
          <div key={f.id} className="rounded-xl bg-white/5 px-4 py-3">
            <dt className="text-sm text-muted">{f.front}</dt>
            <dd className="mt-1 font-mono font-semibold">{f.back}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {LINK_KINDS.map(({ key, label }) =>
          topic.links[key].length ? (
            <p key={key}>
              <span className="text-muted">{label}: </span>
              {topic.links[key].map((id, i) => (
                <span key={id}>
                  {i > 0 && ', '}
                  <Link to={`/handbook?topic=${id}`} className="font-semibold text-[#e879f9] underline-offset-4 hover:underline">
                    {topicById(id)?.title ?? id}
                  </Link>
                </span>
              ))}
            </p>
          ) : null,
        )}
      </div>

      {grouped.length > 0 && (
        <section className="mt-5 border-t border-white/10 pt-4" aria-label={`Мои заметки: ${topic.title}`}>
          <h3 className="flex items-center gap-2 text-[15px] font-semibold">
            <NotebookPen size={16} className="text-pink" aria-hidden="true" /> Мои заметки
          </h3>
          <ul className="mt-2 space-y-2">
            {grouped.slice(0, 6).map(({ note, count }) => (
              <li key={note.id} className="rounded-xl bg-pink/8 px-4 py-3 text-[15px]">
                <span className="font-semibold text-[#fbcfe8]">{ERROR_LABELS[note.kind]}</span>
                {count > 1 && <span className="text-muted"> · {count} раза</span>}
                <p className="mt-1">{note.text}</p>
                <p className="mt-1 text-sm text-muted">Например: {note.taskText}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </Card>
  );
}
