import { Page } from '@/components/layout/AppShell.tsx';
import { ButtonLink } from '@/components/primitives/Button.tsx';

export default function NotFoundPage() {
  return (
    <Page>
      <div className="grid min-h-[60dvh] place-items-center text-center">
        <div>
          <h1 className="font-display text-2xl font-bold">Такой страницы нет</h1>
          <p className="mt-2 text-muted">Возможно, ссылка устарела. Начните с главной.</p>
          <ButtonLink to="/" className="mt-6">
            На главную
          </ButtonLink>
        </div>
      </div>
    </Page>
  );
}
