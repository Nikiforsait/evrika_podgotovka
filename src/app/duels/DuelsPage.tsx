import { useLiveQuery } from 'dexie-react-hooks';
import { Settings, Swords, UserPlus } from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Page } from '@/components/layout/AppShell.tsx';
import { IconButton, TopBar } from '@/components/layout/TopBar.tsx';
import { DuelCard } from '@/components/game/DuelCard.tsx';
import { LeaderRow } from '@/components/game/LeaderRow.tsx';
import { LeagueCard } from '@/components/game/LeagueCard.tsx';
import { weekKey } from '@/data/classmates.ts';
import { Button } from '@/components/primitives/Button.tsx';
import { Card, Section } from '@/components/primitives/Card.tsx';
import { Tabs } from '@/components/primitives/Tabs.tsx';
import { db } from '@/data/db.ts';
import { createDuel, leaderboard } from '@/data/duels.ts';
import { useProfile, useTasks } from '@/hooks/data.ts';
import { InviteRow } from './InviteRow.tsx';

type Filter = 'active' | 'all';

export default function DuelsPage() {
  const navigate = useNavigate();
  const profile = useProfile();
  const { tasks } = useTasks();
  const [filter, setFilter] = useState<Filter>('active');
  const duels = useLiveQuery(() => db.duels.orderBy('updatedAt').reverse().toArray(), [], []);
  const leaders = useLiveQuery(() => leaderboard(), [profile.xp], []);
  const weeklyXp = profile.weekly?.week === weekKey() ? profile.weekly.xp : 0;
  const shown = filter === 'active' ? duels.filter((d) => d.status === 'yourTurn') : duels;

  const startDuel = async () => {
    if (!tasks) return;
    const duel = await createDuel(tasks);
    navigate(`/duels/${duel.id}`);
  };

  return (
    <Page>
      <TopBar
        title="Дуэли"
        backTo="/"
        right={
          <IconButton label="Настройки" onClick={() => navigate('/settings')}>
            <Settings size={22} aria-hidden="true" />
          </IconButton>
        }
      />
      <Tabs
        label="Фильтр дуэлей"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'active', label: 'Активные дуэли' },
          { value: 'all', label: 'Все дуэли' },
        ]}
        className="mt-2"
      />

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {shown.map((d) => (
          <DuelCard key={d.id} duel={d} myName={profile.name} />
        ))}
        {shown.length === 0 && (
          <Card className="flex flex-col items-center gap-3 p-6 text-center lg:col-span-2">
            <Swords size={32} className="text-[#e879f9]" aria-hidden="true" />
            <p className="text-[15px] text-muted">
              {filter === 'active' ? 'Активных дуэлей нет. Брось вызов однокласснику!' : 'Здесь появятся все твои дуэли.'}
            </p>
          </Card>
        )}
      </div>
      <Button full className="mt-4" onClick={() => void startDuel()} disabled={!tasks}>
        <Swords size={20} aria-hidden="true" /> Новая дуэль
      </Button>

      <Section title="Лига">
        <LeagueCard weeklyXp={weeklyXp} />
      </Section>

      <Section title="Вызовы">
        <InviteRow name={profile.name} />
      </Section>

      <Section title="Лидеры класса" action={<span className="text-sm text-muted">XP за неделю</span>}>
        <ol className="space-y-2">
          {leaders.slice(0, 5).map((row, i) => (
            <LeaderRow key={row.id} row={row} rank={i + 1} />
          ))}
          {leaders.findIndex((r) => r.isMe) >= 5 && (
            <LeaderRow row={leaders.find((r) => r.isMe)!} rank={leaders.findIndex((r) => r.isMe) + 1} />
          )}
        </ol>
        <p className="mt-3 flex items-center gap-2 text-sm text-faint">
          <UserPlus size={16} aria-hidden="true" />
          Пока класс не подключён, соперники — тренировочные.
        </p>
      </Section>
    </Page>
  );
}
