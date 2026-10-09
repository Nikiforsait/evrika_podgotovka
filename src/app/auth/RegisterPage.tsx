import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Immersive } from '@/components/layout/AppShell.tsx';
import { Button } from '@/components/primitives/Button.tsx';
import { Card } from '@/components/primitives/Card.tsx';
import { TextField } from '@/components/primitives/TextField.tsx';
import { LOCAL_ONLY, register } from '@/data/auth.ts';
import { passwordStrength, validateRegistration, type FieldErrors } from '@/lib/auth.ts';

const STRENGTH = ['Слабый', 'Средний', 'Хороший', 'Надёжный'];
const STRENGTH_COLOR = ['#EC4899', '#FACC15', '#A3E635', '#A3E635'];

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const strength = passwordStrength(password);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const found = validateRegistration({ email, name, password });
    setErrors(found);
    if (Object.keys(found).length) return;
    setBusy(true);
    setFormError(null);
    try {
      await register({ email, name, password });
      // Signed in: AuthGate redirects to the start test or the home page.
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Immersive>
      <Card as="section" aria-labelledby="reg-title" glow="strong" className="w-full max-w-md p-6 sm:p-8">
        <p className="text-sm text-muted">Эврика</p>
        <h1 id="reg-title" className="mt-1 font-display text-2xl font-bold">
          Создай аккаунт
        </h1>
        <p className="mt-2 text-[15px] text-muted">Чтобы прогресс, план и стрик сохранялись за тобой.</p>

        <form onSubmit={(e) => void submit(e)} noValidate className="mt-6 space-y-4">
          <TextField label="Почта" type="email" inputMode="email" autoComplete="email" value={email} onChange={setEmail} error={errors.email} placeholder="name@example.com" />
          <TextField label="Имя" autoComplete="given-name" maxLength={24} value={name} onChange={setName} error={errors.name} placeholder="Как тебя называть" />
          <div>
            <TextField
              label="Пароль"
              secret
              autoComplete="new-password"
              value={password}
              onChange={setPassword}
              error={errors.password}
              hint="Не короче 8 символов, с буквами и цифрами"
            />
            {password && (
              <div className="mt-2 flex items-center gap-2" aria-live="polite">
                <div className="flex flex-1 gap-1" aria-hidden="true">
                  {[0, 1, 2, 3].map((i) => (
                    <span key={i} className="h-1.5 flex-1 rounded-full" style={{ background: i <= strength ? STRENGTH_COLOR[strength] : 'rgb(255 255 255 / 0.1)' }} />
                  ))}
                </div>
                <span className="text-xs text-muted">{STRENGTH[strength]}</span>
              </div>
            )}
          </div>

          {formError && (
            <p role="alert" className="rounded-inner bg-pink/10 px-4 py-3 text-[15px] text-[#fbcfe8] ring-1 ring-pink/50">
              {formError}
            </p>
          )}

          <Button type="submit" full disabled={busy}>
            {busy ? 'Создаём…' : 'Создать аккаунт'}
          </Button>
        </form>

        <p className="mt-5 text-center text-sm text-muted">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="font-semibold text-[#e879f9] underline-offset-4 hover:underline">
            Войти
          </Link>
        </p>
        <p className="mt-4 text-center text-xs text-faint">{LOCAL_ONLY ? 'Аккаунт и прогресс хранятся на этом устройстве.' : 'Пароль хранится только в виде хэша. Прогресс доступен с любого устройства.'}</p>
      </Card>
    </Immersive>
  );
}
