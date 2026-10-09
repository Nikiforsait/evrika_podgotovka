# Эврика — math trainer

A local-first, offline-capable web app for secondary-school math practice (≈ 9th grade). Russian UI, no runtime AI, no external analytics. The content covers 19 task numbers of a standard first-part exam structure; the UI itself never names any exam, country or currency.

## Run

Requirements: Node.js 20+ (developed on Node 24, which runs the TypeScript build script natively) and, for content validation, Python 3 with SymPy.

```bash
npm install
npm run content     # build the task pack from templates → public/content/tasks.json.gz
npm run dev         # http://localhost:5173
```

| Script | What it does |
|---|---|
| `npm run validate` | Checks every generated task with SymPy (`pip install sympy` first) |
| `npm test` | Unit tests: SRS, Elo, prediction, error analysis, gamification, learning plan (pure + IndexedDB) |
| `npm run typecheck` | TypeScript strict mode check |
| `npm run build` | Content pack + type check + production build with service worker |
| `npm run preview` | Serve the production build locally |

Deployment: `.github/workflows/pages.yml` publishes the site to GitHub Pages on every push (device-only accounts unless the `API_URL` repository variable points at a hosted `server/index.ts`); `Dockerfile` runs site + API as one service. Subscriptions (free / standard 103 ₽ / max 148 ₽, lesson limits, first month free on max) live in the profile; payment is a stub, see `docs/ПОДПИСКИ.md`. Accounts and progress live on a small Node server (`npm run server`, see `server/index.ts`): a JSON list of users in `server/data/users.json` (email, name, PBKDF2 hash, session tokens, synced progress). `npm start` serves the built site and the API together; `VITE_API_URL` (see `.env.example`) points the site at a separately hosted API.

## Content: 19 task numbers, 4 levels

Source material: seven spreadsheets of sample problems (tasks 1–19) were analysed and turned into **136 parameterized templates** in `content/templates/` plus **2 practical scenarios** in `content/scenarios/` (paper formats, tyres). A scenario instance yields five linked tasks 1–5 that share one story, one data table and one figure, exactly like a real part-1 test; the diagnostic always takes tasks 1–5 from a single instance. Each template produces up to 14 distinct variants → **≈2 060 tasks**, about 680 with SVG figures (`content/figures.ts`, `content/scenarioFigures.ts`) and 240 with tables. All numbers are generated, so no task copies a published problem, every one validated by SymPy (`expr` must equal `answer`; answers are integers, fractions with denominator ≤ 100, or terminating decimals).

| № | Topic (`topics.json`) | Sub-types covered |
|---|---|---|
| 1–5 | Practical block: paper formats A0–A7 | matching formats to sizes, 2ⁿ sheet counts, dimensions with rounding, area and √2 ratios, pack mass / font scaling |
| 6 | Arithmetic | fraction ±, ×, ÷; decimals ±, ×, ÷; reciprocals 1/(1/a+1/b); percentages |
| 7 | Number line | fraction / √a between integers, fraction in a segment, decimal intervals, a number between two fractions, a marked point |
| 8 | Powers and roots | aᵐ·aⁿ·aᵏ, quotients, √(c·aᵐ/bⁿ), √(a²ⁿ(−a)ᵐ), √(perfect square) = |…| |
| 9 | Equations | linear (3 forms), brackets, x² = a, ax² = bx, full quadratics (discriminant / Vieta) |
| 10 | Probability | classical m/n, complements, groups, "A or B", lottery order |
| 11 | Graphs (text-described) | signs of k, b; matching lines / parabolas / hyperbola to descriptions |
| 12 | Formulas | substitute, rearrange a product, three-factor formula with g, square root |
| 13 | Inequalities | systems → interval, linear with sign flip, quadratic by roots, integer counts |
| 14 | Progressions | nth term, sums, finding n, geometric growth |
| 15–17 | Triangles, circles, quadrilaterals | angle sums, isosceles, exterior angles, inscribed/central angles, rhombus heights, midlines |
| 18 | Areas on grid paper | rectangles, triangles, parallelograms, trapezoids, rhombi by coordinates, cut-out shapes |
| 19 | True/false statements | 70 geometry statements in three tiers: yes/no, pick the true one, list all true |

**Levels.** Every task number has four levels: **0 — основа** (prerequisite drill), **1 — базовый**, **2 — средний**, **3 — сложный** (full difficulty). The source sheets' `0 / слабый / средний / ОГЭ` map to 0–3.

**Answer formats.** Numeric input (accepts `2,5`, `2.5`, `5/2`, `4 000`), 2–4 way choice with numeric or prose options (intervals, statements, "Да/Нет"), digit sequences for matching tasks (`2314`), and order-independent digit sets for "list all true statements" (`13` = `31`).

## Diagnostic → individual plan

1. **Diagnostic** (`src/data/diagnostic.ts`): one level-2 question per task number — 19 questions, ~10 minutes. A correct answer sets the topic's starting mastery to 0.7, a wrong one to 0.2 (the evidence is thin, so the scale is compressed). Runs are kept (last 12); the result screen compares with the previous run.
2. **Plan** (`src/lib/plan.ts`, pure; `src/data/plan.ts`, data; `/plan` page):
   - **Working level** per task number: start at 3 if the diagnostic question was right, otherwise 1. Then walk by the last 5 attempts at that level: ≥ 4/5 correct → level up; ≤ 2/5 → one level down (to 0 = foundation drills). Level 3 with ≥ 4/5 and mastery ≥ 0.6 → **mastered**.
   - **Priority** = weight × (1 − mastery) × (1 + 0.5 × staleness); mastered topics get 0.1 × weight for occasional review.
   - **Today** = 3 blocks of 5 tasks at the topic's working level (topics already practised today are pinned so a started block can be finished), plus a formula-card block when reviews are due.
   - **Week map**: the ranked queue laid out over 7 days, 3 task numbers per day; recomputed after every attempt.
   - Each practice block opens `/practice?topic=…&level=…&count=5&from=plan` and returns to the plan.

## Architecture

```
content/             build-time content pipeline
  templates/*.ts     parameterized task templates, one file per task number (t06 split in two)
  helpers.ts         number formatting, labelled options, digit answers, superscripts
scripts/
  build-content.ts   expands templates → tasks, builds distractors, writes gzipped JSON
  validate_content.py SymPy check: expr == answer, clean numbers, unique options
src/
  app/               routes, one folder per screen (React Router, lazy-loaded); /plan is the hub
  components/        primitives, layout, quiz, task, topic, plan, game, widgets
  design-system/     tokens.ts (mirrors @theme in index.css), glossary.md
  data/              Dexie (IndexedDB) stores and domain logic: progress, cards, diagnostic,
                     plan, duels, planner, stats, sync; topics.json (19 task numbers)
  lib/               pure algorithms: srs, elo, predict, errors, gamification, plan
server/api.ts           register / login / logout / sync over a JSON user list (Fetch API)
server/index.ts         Node host: users.json persistence + static hosting of dist/
server/sync-handler.ts  delta-sync merge logic (reused by api.ts)
```

### Algorithms (`src/lib`)

- **`srs.ts`** — SM-2 for formula cards (67 cards across 19 topics).
- **`elo.ts`** — learner and task ratings on one Elo scale; next task = unseen task with P(correct) closest to 0.7. Level base ratings: 720 / 850 / 1000 / 1150.
- **`predict.ts`** — per-topic mastery `mastery += 0.1 · (result − mastery)`; predicted score = Σ maxScore × mastery over 19 topics (max 19) with an ~80% band.
- **`errors.ts`** — rule-based analysis of wrong answers (sign, decimal shift, rounding/boundary, digit swap, wrong formula); the same rules generate distractors; mistakes become handbook notes.
- **`plan.ts`** — the individual learning plan described above.
- **`gamification.ts`** — XP (6/10/15/20 by level, half with a hint), levels, tiers, streaks with freeze tokens, 100-day challenge.

### Offline and sync

The service worker precaches the app shell, fonts and `content/tasks.json.gz` (≈160 KB); after the first visit everything works offline. All progress lives in IndexedDB via Dexie. `src/data/sync.ts` pushes/pulls deltas when online; attempts and notes are append-only, profile progress takes the maximum, other records are last-writer-wins.

## Design

Tokens follow the written brief (Figma was not available): deep violet background, violet/magenta accents, lime success, 20–24 px radii, glow shadows; type Unbounded / Onest / JetBrains Mono, bundled for offline use. The CTA gradient is a shade deeper than the brief's pink so white text meets WCAG AA. Accessibility: focus rings, skip link, ARIA on tabs/radios/switches/progress bars, statuses never rely on color alone, reduced motion respected, keyboard-operable quiz.

## Security

See [docs/security-review.md](docs/security-review.md) for the latest review (dependency audit, input validation, CSP). Highlights: passwords are hashed with PBKDF2 on the device; the production build ships a Content-Security-Policy that allows only same-origin scripts; `server/sync-handler.ts` validates and limits all input but **must be deployed behind real authentication** that sets `X-Learner-Id`. Add `X-Frame-Options`, `X-Content-Type-Options` and HSTS as HTTP headers on your host.

## Known limitations

- Duel opponents and the class league are seeded practice classmates until a class backend is connected.
- Figures are generated SVG (triangles, circles, quadrilaterals, grids, number lines, graphs); there are no photographs or scanned pictures.
- Payments and analytics endpoints are not implemented; no external analytics are used.
- PDF export uses the browser's print dialog.
- `docs/` holds an earlier product spec; where it differs, this README and the code are current.
