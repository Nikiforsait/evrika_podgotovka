/** One-line brand tagline shown at the top of every page except solving screens. */
export function BrandStrip() {
  return (
    <p className="no-print w-full bg-[#120726]/80 px-4 pt-[calc(env(safe-area-inset-top)+0.375rem)] pb-1.5 text-center text-[13px] text-muted">
      <span className="font-display font-semibold text-ink">Эврика</span> — твой личный тренер по ОГЭ
    </p>
  );
}
