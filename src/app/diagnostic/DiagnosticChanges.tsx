import { ArrowDownRight, ArrowUpRight, Minus } from 'lucide-react';
import { Card, Section } from '@/components/primitives/Card.tsx';
import { topicById } from '@/data/topics.ts';
import type { DiagnosticComparison, TopicChange, Trend } from '@/lib/diagnosticCompare.ts';
import { percent, plural } from '@/lib/format.ts';

const DATE = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });

const TONE: Record<Trend, { color: string; icon: typeof ArrowUpRight; word: string }> = {
  up: { color: 'text-lime', icon: ArrowUpRight, word: 'выросла' },
  down: { color: 'text-[#f9a8d4]', icon: ArrowDownRight, word: 'снизилась' },
  same: { color: 'text-muted', icon: Minus, word: 'не изменилась' },
};

const signed = (n: number, suffix = '') => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${Math.abs(n)}${suffix}`;
const trendOf = (n: number): Trend => (n > 0 ? 'up' : n < 0 ? 'down' : 'same');

function Delta({ label, value, text }: { label: string; value: number; text: string }) {
  const tone = TONE[trendOf(value)];
  const Icon = tone.icon;
  return (
    <div className="rounded-inner bg-surface p-4 shadow-glow">
      <p className="text-[13px] text-muted">{label}</p>
      <p className={`mt-1 flex items-center gap-1.5 font-display text-2xl font-bold ${tone.color}`}>
        <Icon size={22} aria-hidden="true" />
        <span className="num">{text}</span>
      </p>
    </div>
  );
}

function ChangeRow({ change }: { change: TopicChange }) {
  const tone = TONE[change.trend];
  const Icon = tone.icon;
  const title = topicById(change.topicId)?.title ?? change.topicId;
  const pts = Math.round(change.delta * 100);
  return (
    <li
      className="flex min-h-12 items-center gap-3"
      aria-label={`${title}: точность ${tone.word}, было ${percent(change.before)}, стало ${percent(change.after)}`}
    >
      <Icon size={18} className={`shrink-0 ${tone.color}`} aria-hidden="true" />
      <span className="flex-1 text-[15px] font-medium">{title}</span>
      <span className="num font-mono text-sm text-muted" aria-hidden="true">
        {percent(change.before)} → {percent(change.after)}
      </span>
      <span className={`num w-14 text-right font-mono text-sm font-semibold ${tone.color}`} aria-hidden="true">
        {signed(pts, '%')}
      </span>
    </li>
  );
}

function Group({ title, items }: { title: string; items: TopicChange[] }) {
  if (!items.length) return null;
  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold text-muted">{title}</h3>
      <ul>
        {items.map((c) => (
          <ChangeRow key={c.topicId} change={c} />
        ))}
      </ul>
    </div>
  );
}

/** "What changed" block: compares this diagnostic with the previous run. */
export function DiagnosticChanges({ cmp }: { cmp: DiagnosticComparison }) {
  const pts = cmp.scoreDelta;
  const acc = Math.round(cmp.accuracyDelta * 100);
  const nothingMoved = !cmp.improved.length && !cmp.worsened.length;

  return (
    <Section
      title="Что изменилось"
      action={<span className="text-sm text-muted">с {DATE.format(new Date(cmp.previousDate))}</span>}
    >
      <div className="grid grid-cols-2 gap-3">
        <Delta label="Прогноз" value={pts} text={`${signed(pts)} ${plural(Math.abs(pts), ['балл', 'балла', 'баллов'])}`} />
        <Delta label="Точность" value={acc} text={signed(acc, '%')} />
      </div>
      <Card className="mt-3 space-y-4 p-4 sm:p-5">
        {nothingMoved ? (
          <p className="text-[15px] text-muted">По темам результат почти такой же, как в прошлый раз.</p>
        ) : null}
        <Group title="Стало лучше" items={cmp.improved} />
        <Group title="Стало хуже" items={cmp.worsened} />
        <Group title="Без изменений" items={cmp.unchanged} />
      </Card>
    </Section>
  );
}
