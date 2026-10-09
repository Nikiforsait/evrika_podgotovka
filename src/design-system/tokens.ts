// Design tokens. Source: the written design brief (Figma was not available).
// CSS custom properties with the same values live in src/index.css (@theme);
// this file exposes them to TypeScript for SVG and canvas drawing.

export const color = {
  bg: '#1A0B2E', // deep violet, page background
  bgRaised: '#2D1B4E', // gradient end, raised surfaces
  surface: '#26143F', // cards
  surfaceHigh: '#331D57', // inputs, selected states
  border: 'rgba(168, 85, 247, 0.28)',
  violet: '#A855F7', // primary accent
  magenta: '#D946EF', // secondary accent
  pink: '#EC4899', // CTA gradient start, warnings
  lime: '#A3E635', // success, correct answers
  yellow: '#FACC15', // medium mastery
  cyan: '#22D3EE', // achievements
  orange: '#FB923C', // streak flame
  text: '#F5F0FF',
  textMuted: '#B9ACD9',
  textFaint: '#8E7FB3', // secondary captions, ~4.7:1 on surface
} as const;

export const gradient = {
  // Deeper than pink/magenta so white text on buttons reaches 4.5:1 contrast.
  cta: 'linear-gradient(135deg, #DB2777 0%, #C026D3 100%)',
  selected: `linear-gradient(135deg, ${color.violet} 0%, ${color.magenta} 100%)`,
  page: `linear-gradient(180deg, ${color.bgRaised} 0%, ${color.bg} 45%, #0E0619 100%)`,
  gauge: [color.violet, color.pink, color.lime] as const,
} as const;

export const radius = { input: 16, inner: 20, card: 24, pill: 9999 } as const;

export const font = {
  display: '"Unbounded Variable", "Onest Variable", system-ui, sans-serif',
  body: '"Onest Variable", system-ui, sans-serif',
  mono: '"JetBrains Mono Variable", ui-monospace, monospace',
} as const;

export const motion = { fast: 0.12, base: 0.22, slow: 0.6 } as const;

/** Mastery level → color, label (Russian UI) and icon name. */
export const masteryTone = {
  low: { color: color.pink, label: 'низкий' },
  medium: { color: color.yellow, label: 'средний' },
  high: { color: color.lime, label: 'высокий' },
} as const;
