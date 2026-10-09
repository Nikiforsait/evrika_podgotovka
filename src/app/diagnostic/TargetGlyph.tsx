import { motion, useReducedMotion } from 'framer-motion';

/** Concentric glowing rings: the one orchestrated motion moment of the app. */
export function TargetGlyph() {
  const reduce = useReducedMotion();
  const rings = [96, 70, 44];
  return (
    <div className="relative grid size-56 place-items-center" aria-hidden="true">
      <div className="absolute inset-0 rounded-full bg-magenta/25 blur-3xl" />
      {rings.map((r, i) => (
        <motion.span
          key={r}
          className="absolute rounded-full border-[3px]"
          style={{
            width: r * 2,
            height: r * 2,
            borderColor: i === 1 ? '#D946EF' : '#A855F7',
            boxShadow: '0 0 24px rgb(217 70 239 / 0.55), inset 0 0 18px rgb(217 70 239 / 0.35)',
          }}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={reduce ? { scale: 1, opacity: 1 } : { scale: [0.6, 1.04, 1], opacity: 1 }}
          transition={{ delay: 0.12 * (rings.length - i), duration: 0.7, ease: 'easeOut' }}
        />
      ))}
      <motion.span
        className="relative size-7 rounded-full bg-lime"
        style={{ boxShadow: '0 0 28px 6px rgb(163 230 53 / 0.65)' }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.55, type: 'spring', stiffness: 300, damping: 14 }}
      />
    </div>
  );
}
