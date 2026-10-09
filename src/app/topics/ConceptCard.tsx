import { Lightbulb } from 'lucide-react';
import { Button } from '@/components/primitives/Button.tsx';
import { Card } from '@/components/primitives/Card.tsx';
import { markConceptRead } from '@/data/progress.ts';

/** First step of a topic: the core idea in two sentences. */
export function ConceptCard({ topicId, text }: { topicId: string; text: string }) {
  return (
    <Card as="section" aria-label="Понятие" className="mt-6 p-5" glow="strong">
      <div className="flex gap-3">
        <Lightbulb size={22} className="mt-0.5 shrink-0 text-yellow" aria-hidden="true" />
        <div>
          <h2 className="font-display text-base font-semibold">Коротко о теме</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-ink/90">{text}</p>
          <Button variant="soft" className="mt-4" onClick={() => void markConceptRead(topicId)}>
            Понятно, дальше
          </Button>
        </div>
      </div>
    </Card>
  );
}
