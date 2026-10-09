import { useLiveQuery } from 'dexie-react-hooks';
import { Award, Bell, Flame, HelpCircle, Settings, Sparkles, Star, Volume2 } from 'lucide-react';
import { useState } from 'react';
import { Page } from '@/components/layout/AppShell.tsx';
import { AchievementIcon } from '@/components/game/AchievementIcon.tsx';
import { ActivityChart } from '@/components/game/ActivityChart.tsx';
import { StatTile } from '@/components/game/StatTile.tsx';
import { Avatar } from '@/components/primitives/Avatar.tsx';
import { Card, Section } from '@/components/primitives/Card.tsx';
import { ListRow, Switch } from '@/components/primitives/ListRow.tsx';
import { Pill } from '@/components/primitives/Pill.tsx';
import { Tabs } from '@/components/primitives/Tabs.tsx';
import { updateProfile } from '@/data/profile.ts';
import { achievements, dailyActivity, type Period } from '@/data/stats.ts';
import { useProfile } from '@/hooks/data.ts';
import { toLocalDate } from '@/lib/dates.ts';
import { plural } from '@/lib/format.ts';
import { currentStreak, levelFromXp, TIER_LABELS, tierFromXp } from '@/lib/gamification.ts';
import { SubscriptionSection } from '@/components/profile/SubscriptionSection.tsx';
import { TopicGains } from './TopicGains.tsx';

const PERIODS: { value: Period; label: string }[] = [
  { value: 'week', label: 'Неделя' },
  { value: 'month', label: 'Месяц' },
  { value: 'all', label: 'Всё' },
];

export default function ProfilePage() {
  const profile = useProfile();
  const [period, setPeriod] = useState<Period>('week');
  const badges = useLiveQuery(() => achievements(profile), [profile], []);
  const activity = useLiveQuery(() => dailyActivity(period), [period, profile.xp], []);
  const { level } = levelFromXp(profile.xp);
  const streak = currentStreak(profile, toLocalDate());
  const earned = badges.filter((b) => b.earned).length;

  const setSetting = (key: 'notifications' | 'sounds', value: boolean) => {
    if (key === 'notifications' && value && 'Notification' in window) void Notification.requestPermission();
    void updateProfile({ settings: { ...profile.settings, [key]: value } });
  };

  return (
    <Page accent>
      <header className="flex flex-col items-center pt-8 text-center">
        <div className="relative">
          <Avatar name={profile.name} size={72} />
          <span className="num absolute -right-2 -bottom-1 grid size-8 place-items-center rounded-full bg-cta font-display text-xs font-bold ring-4 ring-bg">
            {level}
          </span>
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold">{profile.name}</h1>
        <div className="mt-2 flex gap-2">
          <Pill tone="violet">Уровень {level}</Pill>
          <Pill tone="lime">{TIER_LABELS[tierFromXp(profile.xp)]}</Pill>
        </div>
      </header>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile icon={Star} label="Уровень" value={String(level)} color="#A855F7" />
        <StatTile icon={Flame} label="Стрик" value={`${streak} ${plural(streak, ['день', 'дня', 'дней'])}`} color="#FB923C" />
        <StatTile icon={Sparkles} label="XP" value={String(profile.xp)} color="#A3E635" />
        <StatTile icon={Award} label="Значки" value={`${earned} из ${badges.length}`} color="#22D3EE" />
      </div>

      <SubscriptionSection profile={profile} />

      <Section title="Достижения">
        <ul className="grid grid-cols-3 gap-x-3 gap-y-5">
          {badges.map((a) => (
            <AchievementIcon key={a.id} a={a} />
          ))}
        </ul>
      </Section>

      <Section title="Прогресс">
        <Tabs label="Период" value={period} onChange={setPeriod} options={PERIODS} />
        <Card className="mt-3 p-4 sm:p-5">
          <ActivityChart data={activity} />
        </Card>
      </Section>

      <Section title="Прирост по темам">
        <TopicGains period={period} />
      </Section>

      <Card className="mt-8 p-2" as="section" aria-label="Настройки профиля">
        <ListRow
          icon={Bell}
          label="Уведомления"
          trailing={<Switch label="Уведомления" checked={profile.settings.notifications} onChange={(v) => setSetting('notifications', v)} />}
        />
        <ListRow icon={Settings} label="Настройки" to="/settings" />
        <ListRow
          icon={Volume2}
          label="Звуки"
          trailing={<Switch label="Звуки" checked={profile.settings.sounds} onChange={(v) => setSetting('sounds', v)} />}
        />
        <ListRow icon={HelpCircle} label="Помощь" to="/help" />
      </Card>
    </Page>
  );
}
