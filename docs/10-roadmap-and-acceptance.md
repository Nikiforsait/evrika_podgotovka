# 10 — Roadmap, Acceptance Criteria, Risks

## 1. Delivery phases

| Phase | Scope | Exit criterion |
|---|---|---|
| **0. Foundations** | Answer the open questions (00-README). Extract the Figma tokens. Supply the topic dictionary | Tokens and dictionary approved; Excel has an answer key |
| **1. Content pipeline** | Ingestion, validation report, theory card review, content pack v1 | A pack builds with zero errors for all Part 1 topics |
| **2. Engine** | Lesson assembly, feedback scoring, Elo, BKT, SRS, session planner, with a golden-file test suite | All engine tests pass; plans are deterministic |
| **3. Student app (offline)** | App shell, local SQLite, Dashboard, Quiz, Diagnostics Intro and Results, Session runner, Reference library, Profile, Settings | Every student flow works in airplane mode |
| **4. Sync and backend** | Accounts via class code, event sync, multi-device merge, content updates | Two devices offline → both sync → identical state |
| **5. Social** | Duels, School League, Challenges | Async duel completes across two offline devices |
| **6. Teacher Console** | Classes, auto-scheduling, mock exams, analytics | A teacher can assign a topic and see the focus list |
| **7. Hardening** | Accessibility audit, performance budgets, privacy review, pilot with one school | Pilot feedback incorporated |

## 2. Acceptance criteria (key)

**Offline**
- With the network disabled after first install, a student can complete the diagnostic, a full daily session, a review, and a duel turn, and can browse the reference library.
- No screen shows a spinner that waits for the network. Network-dependent data shows a cached version with its timestamp.

**Lesson engine**
- A lesson always contains 1 theory card and 4 tasks for the target sub-topic plus 1 duel task, with levels following 05, section 2 (including slot shifting).
- Feedback follows 05, section 3 exactly: correct → solution; first wrong → hint; second wrong → answer and solution.
- A task is never repeated within 14 days unless its pool is exhausted.
- The same history and date always produce the same session plan.

**Gamification**
- Completing only the streak challenge keeps the streak.
- Level, XP, streak and predicted score match recomputation from the raw event log.

**Design**
- All five reference screens match the Figma frames at mobile width (visual review sign-off). Desktop layouts follow 03, section 1.
- WCAG AA contrast for text; full keyboard operation of the Quiz; reduced-motion respected; statuses never rely on color alone.

**Teacher**
- Auto-scheduling places all sub-topics before the target date or shows an explicit "doesn't fit" warning.
- The mock exam gives each student a randomized order and options; results are hidden until released.
- The focus list follows the thresholds in 08, section 4.

## 3. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| No answer key in the source data | The app can't check answers | Blocker in phase 0: add an `ответ` column |
| Small task pools per sub-topic | Repeats, memorized answers | Pool-size warnings (04, section 6); AI-drafted variants at build time with human review |
| Browser storage evicted | Lost progress | Request persistent storage; frequent sync; recovery code |
| Weak math rendering in some browsers | Unreadable tasks | Pre-validate every formula at build time; system-font fallback |
| Grade thresholds change yearly | Wrong prediction labels | Thresholds are configuration in the content pack |
| Personal data of minors | Legal exposure | Data minimization; Russian data residency; legal review (07, section 8) |
| Cheating in duels and league | Unfair leaderboard | Server-side resolution, timing flags, hidden duel tasks |
| Elo/BKT defaults mis-tuned | Too hard or too easy | Golden tests plus pilot data; parameters live in config so they can be tuned without a release |
