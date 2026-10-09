import { useLiveQuery } from 'dexie-react-hooks';
import { Card } from '@/components/primitives/Card.tsx';
import { ProgressBar } from '@/components/primitives/ProgressBar.tsx';
import { topicGains, type Period } from '@/data/stats.ts';
import { topicById } from '@/data/topics.ts';

const COLORS = ['#A3E635', '#EC4899', '#FACC15'];

/** Top three topics by mastery gained in the period. */
export function TopicGains({ period }: { period: Period }) {
  const gains = useLiveQuery(() => topicGains(period), [period], {});
  const top = Object.entries(gains)
    .filter(([, g]) => g > 0.005)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (!top.length) {
    return (
      <Card className="p-5 text-[15px] text-muted">
        Реши несколько заданий — здесь появится, в каких темах ты вырос.
      </Card>
    );
  }

  return (
    <Card className="space-y-4 p-5">
      {top.map(([id, gain], i) => {
        const title = topicById(id)?.title ?? id;
        const pct = Math.round(gain * 100);
        return (
          <div key={id}>
            <div className="mb-1.5 flex justify-between text-[15px]">
              <span className="font-medium">{title}</span>
              <span className="num font-mono font-semibold" style={{ color: COLORS[i] }}>
                +{pct}%
              </span>
            </div>
            <ProgressBar value={gain} color={COLORS[i]} label={`${title}: прирост ${pct}%`} />
          </div>
        );
      })}
    </Card>
  );
}
