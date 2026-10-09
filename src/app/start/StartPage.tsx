import { motion } from 'framer-motion';
import { Immersive } from '@/components/layout/AppShell.tsx';
import { ButtonLink } from '@/components/primitives/Button.tsx';
import { QUICK_MINUTES, QUICK_SCORED } from '@/data/quickDiagnostic.ts';
import { useProfile } from '@/hooks/data.ts';
import { TargetGlyph } from '../diagnostic/TargetGlyph.tsx';

/** Entry screen of the mandatory short diagnostic right after registration. */
export default function StartPage() {
  const profile = useProfile();
  const retake = Boolean(profile.quickDiagnostic);
  return (
    <Immersive>
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <TargetGlyph />
        <p className="mt-10 text-[15px] text-muted">{retake ? `${profile.name}, проверим себя ещё раз` : `Привет, ${profile.name}! Начнём с короткой проверки`}</p>
        <motion.h1
          className="mt-2 font-display text-[40px] leading-tight font-bold tracking-tight sm:text-5xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          Стартовый тест
        </motion.h1>
        <p className="mt-3 text-[17px] text-ink/85">
          {QUICK_SCORED} задач · {QUICK_MINUTES} минут · ответы с выбором
        </p>
        <ul className="mt-5 space-y-1 text-[15px] text-muted">
          <li>2 задачи по алгебре</li>
          <li>1 задача по теории вероятностей</li>
          <li>1 задача на прогрессии</li>
          <li>2 задачи по геометрии</li>
        </ul>
        <ButtonLink to="/start/quiz" full className="mt-10 min-h-16 text-lg">
          Начать
        </ButtonLink>
        <p className="mt-6 text-sm text-muted">
          {profile.diagnostic ? 'Результат переведём в баллы первой части. План уже строится по полной диагностике и не изменится.' : 'Результат переведём в баллы первой части, а план подстроится под тебя.'}
        </p>
        {retake && (
          <ButtonLink to="/" variant="ghost" className="mt-2">
            Не сейчас
          </ButtonLink>
        )}
      </div>
    </Immersive>
  );
}
