import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { Immersive } from '@/components/layout/AppShell.tsx';
import { Button } from '@/components/primitives/Button.tsx';
import { Card } from '@/components/primitives/Card.tsx';
import { TextField } from '@/components/primitives/TextField.tsx';
import { login } from '@/data/auth.ts';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Введите почту и пароль.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await login(email, password);
      // Signed in: AuthGate redirects to the start test or the home page.
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Immersive>
      <Card as="section" aria-labelledby="login-title" glow="strong" className="w-full max-w-md p-6 sm:p-8">
        <p className="text-sm text-muted">Эврика</p>
        <h1 id="login-title" className="mt-1 font-display text-2xl font-bold">
          С возвращением
        </h1>
        <form onSubmit={(e) => void submit(e)} noValidate className="mt-6 space-y-4">
          <TextField label="Почта" type="email" inputMode="email" autoComplete="email" value={email} onChange={setEmail} placeholder="name@example.com" />
          <TextField label="Пароль" secret autoComplete="current-password" value={password} onChange={setPassword} />
          {error && (
            <p role="alert" className="rounded-inner bg-pink/10 px-4 py-3 text-[15px] text-[#fbcfe8] ring-1 ring-pink/50">
              {error}
            </p>
          )}
          <Button type="submit" full disabled={busy}>
            {busy ? 'Входим…' : 'Войти'}
          </Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          Нет аккаунта?{' '}
          <Link to="/register" className="font-semibold text-[#e879f9] underline-offset-4 hover:underline">
            Создать
          </Link>
        </p>
      </Card>
    </Immersive>
  );
}
