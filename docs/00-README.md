# Eureka — Project Specification

Eureka is an offline-first web application that prepares 9th-grade students for the Russian OGE mathematics exam. It turns raw problem sets (Excel) into adaptive, gamified micro-lessons, daily study sessions, and teacher-managed class plans.

This folder is the complete specification. It contains no code; every document is a functional or architectural description intended to be implemented directly.

## Document map

| File | Contents |
|---|---|
| [01-product-overview.md](01-product-overview.md) | Vision, users, scope, principles, glossary |
| [02-design-system.md](02-design-system.md) | Figma extraction procedure, tokens, typography, components, motion, accessibility |
| [03-screens-and-components.md](03-screens-and-components.md) | Responsive layout, navigation, the five core screens, component hierarchies, states |
| [04-data-model-and-ingestion.md](04-data-model-and-ingestion.md) | Excel format, parsing, math normalization, validation, content database schema |
| [05-lesson-engine.md](05-lesson-engine.md) | Lesson assembly, feedback loop, adaptive difficulty (Elo/IRT), mastery (Bayesian), spaced repetition |
| [06-sessions-and-gamification.md](06-sessions-and-gamification.md) | Daily session assembly, XP, streaks, levels, "Path to 19", duels, leaderboard |
| [07-offline-architecture-and-sync.md](07-offline-architecture-and-sync.md) | Local-first runtime, SQLite in the browser, content packs, event log, sync, backend |
| [08-teacher-mode.md](08-teacher-mode.md) | B2B: classes, auto-scheduling, mock exams, class analytics |
| [09-analytics-and-diagnostics.md](09-analytics-and-diagnostics.md) | Diagnostic test, predicted score, mastery dashboard, time tracking |
| [10-roadmap-and-acceptance.md](10-roadmap-and-acceptance.md) | Delivery phases, acceptance criteria, risks |

## Open questions (must be answered before build)

These are gaps or contradictions found in the source brief. Each document repeats the relevant item where it matters.

1. **No answer-key column.** The Excel columns list `условие`, `вопрос`, `формат ответа`, `варианты`, `подсказка`, `решение`, but no correct answer. Automatic checking is impossible without it. Recommended fix: add a column `ответ`. Alternative: mark the correct option inside `варианты` with a leading `*`. See 04, section 3.
2. **Figma source and reference images were not provided.** Design tokens in 02 are provisional values that follow the written description. Replace them with values extracted from the Figma file (procedure in 02, section 1).
3. **Diagnostics length.** The brief says "20 questions, first part", but OGE Part 1 has 19 tasks and the results screen shows "14 out of 19". This spec uses **19 questions** (one per Part 1 task number). Confirm.
4. **"Path to 19".** This spec interprets it as reaching the maximum Part 1 score (19/19), with five milestones tied to grade thresholds. Thresholds change yearly, so they are configuration rather than constants. Confirm the milestone values.
5. **Separator inside `варианты`.** Not specified. The parser accepts `;`, newline, or `|` and reports which one it detected. Confirm the canonical one.
6. **Mapping `номер` → topic names.** Display names ("Percentages", "Areas", "Charts") need a lookup table supplied by the content team (04, section 5).
7. **Lesson size.** The algorithm section describes 3–5 tasks per lesson. The build brief adds a theory card and a duel task. This spec uses: 1 theory card + 4 practice tasks + 1 duel task (≈10–15 minutes).
