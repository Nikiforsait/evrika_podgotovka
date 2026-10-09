# 01 — Product Overview

## 1. Vision

A 9th-grader opens Eureka for 10–20 minutes a day, on any device, with or without internet. Each day they get a short, personal plan: review what they are about to forget, learn one new idea, practise it at the right difficulty, and compete with a classmate. The app always shows how close they are to the score they want on the OGE.

## 2. Users

| User | Goal | Primary surfaces |
|---|---|---|
| **Student** (14–16 years) | Pass the OGE with the best possible grade without boring drills | Dashboard, Daily Session, Quiz, Duels, Diagnostics |
| **Teacher** (school / tutor) | Cover the syllabus before a deadline, see who is struggling and on what | Teacher Console: classes, schedule, mock exams, analytics |
| **Content editor** (internal) | Turn Excel problem banks into a validated content pack | Build-time ingestion pipeline and its validation report |

## 3. Scope

**In scope (v1):** OGE Mathematics Part 1 (task numbers 1–19), Russian-language UI, responsive web app installable as a PWA, full offline use, student and teacher roles, asynchronous duels, school leaderboard.

**Out of scope (v1):** Part 2 (extended-answer tasks needing manual grading), runtime AI of any kind, live/real-time video lessons, payments, native app-store builds. (The architecture keeps the engine portable to a native shell later; see 07, section 9.)

## 4. Product principles

1. **Offline is the default, not a fallback.** Every student-facing feature works with no connection. The network is only used to sync progress, exchange duel results, and refresh leaderboards and content.
2. **No runtime AI.** All content, theory cards, hints and solutions are authored or AI-drafted *during development*, reviewed by a human, and shipped as static content. The app's "intelligence" is deterministic algorithms: Elo/IRT, Bayesian mastery, spaced repetition.
3. **Small steps, instant feedback.** Every answer gets immediate feedback with a worked solution.
4. **Honest progress.** Predicted scores and mastery come from the student's actual answers. XP is motivation; mastery is measurement. The two are never mixed.
5. **Deterministic and explainable.** Given the same history, the engine produces the same plan. Teachers can be told *why* a task was chosen.

## 5. Core loop

Open app → Streak challenge (1 quick task) → Spaced-repetition review → New theory → Practice (adaptive) → Duel → Progress update (XP, mastery, predicted score) → Come back tomorrow.

## 6. Glossary

| Term | Meaning |
|---|---|
| **Topic** (`номер`) | An OGE task number / macro-topic, e.g. "Task 9 — Equations". |
| **Sub-topic** (`тип`) | A problem type within a topic, e.g. "Type 2 — quadratic equations". The unit of mastery and of lessons. |
| **Level** | Normalized difficulty: L1 Basic (`0`/`слабый`), L2 Intermediate (`средний`), L3 Exam (`ОГЭ`). |
| **Task** | One problem row from Excel: condition, question, answer format, options, hint, solution, answer key. |
| **Theory card** | A short rule or formula card introducing a sub-topic. |
| **Lesson** | 10–15 minute unit for one sub-topic: theory + 4 tasks + duel task. |
| **Session** | The daily plan: streak challenge, review, new lesson, duel, progress update. |
| **θ (theta)** | Student ability estimate per topic (Elo/IRT scale). |
| **b** | Task difficulty on the same scale as θ. |
| **P(L)** | Bayesian probability that a student has mastered a sub-topic. |
| **SRS** | Spaced repetition system: schedules sub-topic reviews. |
| **Content pack** | Versioned, read-only local database of all topics, tasks and theory cards. |
| **Event log** | Append-only local record of everything the student did. It is the only thing that syncs. |
| **Path to 19** | The visual progression toward the full Part 1 score (19/19), in five milestones. |
