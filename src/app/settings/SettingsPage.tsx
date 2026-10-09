import { useLiveQuery } from 'dexie-react-hooks';
import { Bell, CloudOff, Download, LogOut, Move, Trash2, Volume2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Page } from '@/components/layout/AppShell.tsx';
import { TopBar } from '@/components/layout/TopBar.tsx';
import { Button } from '@/components/primitives/Button.tsx';
import { Card, Section } from '@/components/primitives/Card.tsx';
import { ListRow, Switch } from '@/components/primitives/ListRow.tsx';
import { db, type Settings } from '@/data/db.ts';
import { updateProfile } from '@/data/profile.ts';
import { logout } from '@/data/auth.ts';
import { useProfile } from '@/hooks/data.ts';

export default function SettingsPage() {
  const profile = useProfile();
  const [name, setName] = useState(profile.name);
  const [confirmReset, setConfirmReset] = useState(false);
  const lastSync = useLiveQuery(() => db.meta.get('lastSync'), []);
  const token = useLiveQuery(() => db.meta.get('token'), []);
  const apiMode = useLiveQuery(() => db.meta.get('apiMode'), []);
  useEffect(() => setName(profile.name), [profile.name]);

  const set = (key: keyof Settings, value: boolean) => {
    if (key === 'notifications' && value && 'Notification' in window) void Notification.requestPermission();
    void updateProfile({ settings: { ...profile.settings, [key]: value } });
  };

  const exportData = async () => {
    const data = {
      // Credentials stay on the device: the export is for the learner's own records.
      profile: (await db.profile.toArray()).map(({ account: _account, ...rest }) => rest),
      topics: await db.topics.toArray(),
      attempts: await db.attempts.toArray(),
      cards: await db.cards.toArray(),
      notes: await db.notes.toArray(),
      duels: await db.duels.toArray(),
    };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'evrika-progress.json' });
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAll = async () => {
    await db.delete();
    window.location.assign(import.meta.env.BASE_URL);
  };

  return (
    <Page>
      <TopBar title="Настройки" />
      <Section title="Профиль">
        {profile.account && <p className="mb-3 text-[15px] text-muted">Почта: <span className="text-ink">{profile.account.email}</span></p>}
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (name.trim()) void updateProfile({ name: name.trim().slice(0, 24) });
          }}
        >
          <label htmlFor="name" className="sr-only">Имя</label>
          <input
            id="name"
            value={name}
            maxLength={24}
            onChange={(e) => setName(e.target.value)}
            className="min-h-12 flex-1 rounded-inner bg-surface-high px-4 ring-1 ring-line outline-none focus:ring-magenta"
          />
          <Button type="submit" variant="soft" disabled={!name.trim() || name.trim() === profile.name}>
            Сохранить
          </Button>
        </form>
      </Section>

      <Section title="Приложение">
        <Card className="p-2">
          <ListRow icon={Bell} label="Напоминания о тренировке" trailing={<Switch label="Напоминания" checked={profile.settings.notifications} onChange={(v) => set('notifications', v)} />} />
          <ListRow icon={Volume2} label="Звуки ответов" trailing={<Switch label="Звуки" checked={profile.settings.sounds} onChange={(v) => set('sounds', v)} />} />
          <ListRow icon={Move} label="Меньше анимации" trailing={<Switch label="Меньше анимации" checked={profile.settings.reducedMotion} onChange={(v) => set('reducedMotion', v)} />} />
        </Card>
      </Section>

      {profile.account && (
        <Button variant="ghost" className="mt-6" onClick={() => void logout()}>
          <LogOut size={18} aria-hidden="true" /> Выйти из аккаунта
        </Button>
      )}

      <Section title="Данные">
        <Card className="space-y-4 p-5">
          <p className="flex items-start gap-3 text-[15px] text-muted">
            <CloudOff size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            {token
              ? `Прогресс сохраняется в аккаунте и доступен с любого устройства. ${lastSync?.value ? `Последняя синхронизация: ${new Date(Number(lastSync.value)).toLocaleString('ru-RU')}.` : 'Синхронизации ещё не было.'}`
              : apiMode?.value === 'local'
                ? 'Сервер аккаунтов не подключён: аккаунт и прогресс хранятся на этом устройстве. Приложение работает без интернета.'
                : 'Вы вошли без связи с сервером: прогресс пока хранится только на этом устройстве и отправится в аккаунт при следующем входе онлайн.'}
          </p>
          <Button variant="soft" onClick={() => void exportData()}>
            <Download size={18} aria-hidden="true" /> Скачать мой прогресс
          </Button>
          {confirmReset ? (
            <div className="rounded-inner bg-pink/10 p-4 ring-1 ring-pink/50" role="alert">
              <p className="text-[15px]">Весь прогресс, XP и заметки будут удалены с этого устройства. Отменить это нельзя.</p>
              <div className="mt-3 flex gap-2">
                <Button variant="pill" onClick={() => void resetAll()}>Удалить прогресс</Button>
                <Button variant="ghost" onClick={() => setConfirmReset(false)}>Отмена</Button>
              </div>
            </div>
          ) : (
            <Button variant="ghost" onClick={() => setConfirmReset(true)}>
              <Trash2 size={18} aria-hidden="true" /> Удалить прогресс
            </Button>
          )}
        </Card>
      </Section>
    </Page>
  );
}
