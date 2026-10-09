import type { Duel } from '@/data/db.ts';
import { classmateById } from '@/data/classmates.ts';
import { visibleScore } from '@/data/duels.ts';
import { Avatar } from '../primitives/Avatar.tsx';
import { ButtonLink } from '../primitives/Button.tsx';
import { Card } from '../primitives/Card.tsx';

const SKILL: Record<NonNullable<Duel['opponentSkill']>, string> = { easier: 'соперник послабее', even: 'равный соперник', harder: 'соперник посильнее' };

const STATUS: Record<Duel['status'], string> = {
  yourTurn: 'Твой ход',
  waiting: 'Ждём соперника',
  won: 'Победа',
  lost: 'Поражение',
  draw: 'Ничья',
};

/** Active or finished duel: two avatars, VS, the score and a call to action. */
export function DuelCard({ duel, myName }: { duel: Duel; myName: string }) {
  const mate = classmateById(duel.opponentId);
  const score = visibleScore(duel);
  const playable = duel.status === 'yourTurn';
  const name = mate?.name ?? 'Соперник';

  return (
    <Card glow={playable ? 'strong' : 'default'} className="p-5">
      <div className="flex items-center justify-center gap-5">
        <div className="flex flex-col items-center gap-1.5">
          <Avatar name={myName} hue={290} size={56} />
          <span className="text-sm text-muted">Ты</span>
        </div>
        <div className="text-center">
          <p className="num font-display text-[32px] leading-none font-bold" aria-label={`Счёт ${score.mine} : ${score.theirs}`}>
            {score.mine} : {score.theirs}
          </p>
          <p className="mt-1.5 text-xs font-bold tracking-wide text-[#e879f9]">VS</p>
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <Avatar name={name} hue={mate?.hue} size={56} />
          <span className="text-sm text-muted">{name}</span>
        </div>
      </div>
      <p className="mt-3 text-center text-[15px] font-semibold">
        {STATUS[duel.status]}
        {playable && <span className="font-normal text-muted"> · задание {duel.mine.length + 1} из {duel.taskIds.length}</span>}
      </p>
      {duel.opponentSkill && <p className="mt-1 text-center text-sm text-muted">{SKILL[duel.opponentSkill]}</p>}
      {playable && (
        <ButtonLink to={`/duels/${duel.id}`} full className="mt-4">
          Продолжить
        </ButtonLink>
      )}
    </Card>
  );
}
