import { motion } from 'framer-motion';
import { Immersive } from '@/components/layout/AppShell.tsx';
import { ButtonLink } from '@/components/primitives/Button.tsx';
import { DIAGNOSTIC_LENGTH } from '@/data/topics.ts';
import { useProfile } from '@/hooks/data.ts';
import { TargetGlyph } from './TargetGlyph.tsx';

/** Immersive entry screen for the diagnostic: no top bar, one action. */
export default function DiagnosticStartPage() {
  const profile = useProfile();
  const retake = profile.diagnostic !== null;

  return (
    <Immersive>
      <div className="flex w-full max-w-sm flex-col items-center text-center">
        <TargetGlyph />
        <p className="mt-10 text-[15px] text-muted">{retake ? 'Проверим, что изменилось' : 'Твой уровень: сейчас'}</p>
        <motion.h1
          className="mt-2 font-display text-[40px] leading-tight font-bold tracking-tight sm:text-5xl"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          Полная диагностика
        </motion.h1>
        <p className="mt-3 text-[17px] text-ink/85">
          {DIAGNOSTIC_LENGTH} вопросов · без таймера · первая часть ОГЭ
        </p>
        <ButtonLink to="/diagnostic/quiz" full className="mt-10 min-h-16 text-lg">
          Начать
        </ButtonLink>
        <p className="mt-6 text-sm text-muted">
          {retake && profile.diagnostic
            ? `В прошлый раз: прогноз ${profile.diagnostic.predicted} из ${profile.diagnostic.max}, верно ${profile.diagnostic.correct} из ${profile.diagnostic.total}. После теста покажем, что изменилось.`
            : 'Это не оценка, а точная карта: что уже получается, а что стоит подтянуть'}
        </p>
        <ButtonLink to="/" variant="ghost" className="mt-2">
          Не сейчас
        </ButtonLink>
      </div>
    </Immersive>
  );
}
