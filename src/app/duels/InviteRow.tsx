import { useState } from 'react';
import { Avatar } from '@/components/primitives/Avatar.tsx';
import { Button } from '@/components/primitives/Button.tsx';
import { Card } from '@/components/primitives/Card.tsx';

/** "Invite a friend" row: native share sheet, or copy the link as a fallback. */
export function InviteRow({ name }: { name: string }) {
  const [status, setStatus] = useState<string | null>(null);

  const invite = async () => {
    const url = window.location.origin;
    const text = `${name} зовёт тебя на дуэль в «Эврике» — тренажёре по математике.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Эврика', text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setStatus('Ссылка скопирована');
    } catch {
      setStatus(null); // the user closed the share sheet
    }
  };

  return (
    <Card className="flex flex-wrap items-center gap-4 p-4">
      <Avatar name="+" hue={320} size={48} />
      <p className="flex-1 text-[15px] leading-snug">Пригласи друга, чтобы устроить дуэль</p>
      <Button variant="pill" onClick={() => void invite()}>
        Пригласить
      </Button>
      <p className="w-full text-right text-sm text-lime empty:hidden" role="status">
        {status}
      </p>
    </Card>
  );
}
