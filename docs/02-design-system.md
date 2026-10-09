# 02 — Design System

> **Status: provisional.** The Figma file and the reference images were not available when this was written. Every value below follows the written brief. Section 1 describes how to replace them with the exact values from Figma. Values marked ⚠ must be confirmed.

## 1. Figma integration procedure

The Figma MCP server is configured for this project (`.mcp.json`, server `figma`), together with the official Figma skills (`figma-design-to-code`, `figma-use`, `figma-generate-library`).

1. **Collect links.** For each reference screen, copy a "link to selection" of the top-level frame: Dashboard, Duels & Leaderboard, Diagnostics Intro, Quiz, Diagnostics Results.
2. **Extract variables.** Read the file's variable definitions: colors, spacing, radii and typography. These become the token layer in sections 2–5, replacing the provisional values.
3. **Extract each frame.** Read the design context and a screenshot of each frame. Record component names, auto-layout direction, gaps, paddings and effects (glows, blurs) into the component inventory (section 7).
4. **Map components.** Every Figma component maps to one entry in section 7. If Figma has a variant that isn't listed there, add it to the inventory before building it.
5. **Adapt mobile to web.** The references are mobile frames. Layouts follow the responsive rules in 03, section 1. Tokens stay identical across breakpoints. Only layout changes.
6. **Re-check after each design update.** When Figma changes, re-extract the variables and diff them against the token table. Token names never change, only their values.

## 2. Color tokens

Semantic names are used everywhere. Raw values appear only in this table.

| Token | Role | Provisional value ⚠ |
|---|---|---|
| `bg.gradient.start` | App background, top-left | deep purple `#1A0B3D` |
| `bg.gradient.end` | App background, bottom-right | dark blue `#0B1033` |
| `surface.card` | Card fill | `#221548` at 80% opacity over the background |
| `surface.card.raised` | Modals, feedback sheet | `#2B1B5C` |
| `border.glow` | Card outline | `#8B5CF6` at 35% opacity, 1 px, plus a soft outer glow |
| `primary` | Primary buttons, active nav, XP bar | neon purple `#A855F7` |
| `primary.pressed` | Pressed/hover state | `#9333EA` |
| `secondary` | Secondary actions, duel accents | bright pink `#EC4899` |
| `success` | Correct answer, mastered | neon green `#22FF88` |
| `warning` | Needs review | amber/yellow `#FACC15` |
| `danger` | Incorrect answer, weak topic | `#FF4D6D` |
| `streak` | Fire icon, streak counter | orange `#FF8A00` → `#FFD000` gradient |
| `text.primary` | Body and headings | `#FFFFFF` |
| `text.secondary` | Captions, metadata | `#B9B3D6` |
| `text.on-success` | Text on a green feedback card | `#05200F` (dark, for contrast) |

**Contrast rule.** All body text must reach WCAG AA (4.5:1) against `surface.card`. Neon colors are for fills, icons and large text, never for small body text on dark surfaces.

## 3. Typography

- **Family:** clean, modern sans-serif with full Cyrillic support and tabular figures. ⚠ Confirm from Figma. A safe default is Inter or Manrope.
- **Math:** formulas are rendered with a math typesetting component (see 04, section 4) and sized to match the surrounding text.

| Style | Size / line height | Weight | Use |
|---|---|---|---|
| `display` | 32 / 40 | 800 | Score in the results ring, level number |
| `h1` | 24 / 32 | 700 | Screen titles |
| `h2` | 20 / 28 | 700 | Card titles |
| `body` | 16 / 24 | 400 | Questions, solutions |
| `body.strong` | 16 / 24 | 600 | Answer options, buttons |
| `caption` | 13 / 18 | 500 | Metadata, badges, nav labels |

Minimum body size is 16 px. Questions never go below `body`.

## 4. Spacing, radius, elevation

- **Spacing scale (px):** 4, 8, 12, 16, 20, 24, 32, 40, 48. The card inner padding is 16 on mobile and 24 on desktop.
- **Radius:** `radius.sm` 8 (chips), `radius.md` 16 (cards, answer buttons), `radius.lg` 24 (sheets, modals), `radius.full` (avatars, pills, progress rings).
- **Glow:** cards use a 1 px `border.glow` plus a soft outer glow. Interactive cards brighten the glow on hover and focus. There are no hard drop shadows.

## 5. Motion

| Token | Duration | Use |
|---|---|---|
| `motion.fast` | 120 ms | Button press, toggle |
| `motion.base` | 220 ms | Card enter, feedback sheet slide-up |
| `motion.slow` | 600 ms | Progress ring fill, XP bar fill, milestone unlock |

- Easing is a standard ease-out for entering and ease-in for leaving.
- **Reduced motion:** if the user's system requests reduced motion, the app replaces all movement with opacity fades and skips the confetti and glow pulses.

## 6. Iconography and gamification visuals

- **Icon set:** line icons at 24 px with a 2 px stroke and rounded joins. Active states use a filled variant.
- **Required icons:** home, swords (duels), user, settings, fire (streak), star/XP, target (diagnostics), lightbulb (hint), check, cross, lock (locked milestone), trophy, offline cloud.
- **XP bar:** a horizontal pill filled with a `primary` gradient. The current and next-level XP sit at the right as a caption.
- **Streak counter:** a fire icon with the day count. Seven small dots show the last seven days, filled for active days.
- **Level badge:** a circular or hexagonal badge with the level number in `display` style and a ring showing progress to the next level.
- **Progress ring:** a circular track with an arc filled by a gradient (`primary` to `success`), the score in the center and the percentage below.

## 7. Component inventory

Each component lists its states. Every interactive component also has a visible focus ring (2 px `primary` with a 2 px offset).

| Component | Variants / states |
|---|---|
| `Button` | primary, secondary (pink), ghost; default / hover / pressed / disabled / loading |
| `Card` | static, interactive, highlighted (glow) |
| `AnswerOption` | idle / selected / correct (green) / incorrect (red) / disabled-after-answer |
| `NumericInput` | idle / focused / invalid-format / submitted |
| `MatchingGrid` | idle / partially filled / submitted with per-pair correctness |
| `FeedbackSheet` | correct (green) / hint (amber) / incorrect-final (red, shows solution) |
| `ProgressBar` | topic mastery: color by status (section 8) |
| `ProgressRing` | diagnostics result, level badge |
| `XPBar`, `StreakCounter`, `LevelBadge` | as section 6 |
| `MilestoneTrack` | Path to 19: five nodes, each locked / current / reached |
| `Avatar` | sizes 24 / 32 / 48 / 72; online dot optional |
| `DuelCard` | waiting for opponent / your turn / finished-won / finished-lost / draw |
| `LeaderboardRow` | default / current user (highlighted) / top-3 (medal) |
| `NavBar` | bottom (mobile) / side rail (tablet and desktop) |
| `OfflineBanner` | offline / syncing / sync error |
| `TheoryCard` | collapsed / expanded; formula block |
| `EmptyState`, `Skeleton`, `Toast` | generic |

## 8. Status color mapping

Statuses always pair color with an icon and a text label, so meaning never depends on color alone.

| Status | Condition (see 05) | Color | Icon / label |
|---|---|---|---|
| Mastered | P(L) ≥ 0.95 | `success` | check · "Освоено" |
| Needs review | 0.60 ≤ P(L) < 0.95, or an SRS review is due | `warning` | refresh · "Повторить" |
| Weak | P(L) < 0.60 with ≥ 3 attempts | `danger` | alert · "Слабая тема" |
| Not started | no attempts | `text.secondary` | dot · "Не начато" |
