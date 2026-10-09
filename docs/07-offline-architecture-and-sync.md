# 07 — Offline-First Architecture and Sync

## 1. Principles

1. **The device is the source of truth for the student's experience.** All screens, the engine, SRS, XP and streaks run locally.
2. **The server is thin.** It handles identity, class membership, event backup and merging, leaderboards, duel matchmaking and resolution, item calibration, teacher analytics, and content pack hosting. It never generates lessons.
3. **Only events sync.** Derived state (θ, P(L), SRS schedule, XP, level, streak) is recomputed from events. This makes sync conflict-free.

## 2. Runtime layers (on the device)

| Layer | Responsibility |
|---|---|
| **App shell** | UI, routing, design system. It is cached by a service worker so the app opens with no network |
| **Engine** | Pure functions: lesson assembly, feedback scoring, Elo, BKT, SRS, session planning, XP and streak derivation (05, 06) |
| **Content store** | Read-only SQLite content pack (04, section 8) |
| **Student store** | Read-write SQLite: event log, derived-state cache, outbox, cached server data (leaderboard, roster, duels) |
| **Sync worker** | Pushes the outbox and pulls server updates when online. It runs in the background and never blocks the UI |

**SQLite in the browser.** The app uses SQLite compiled to WebAssembly, with persistent storage in the browser's private origin file system (OPFS), running in a web worker so queries never freeze the UI. On browsers without OPFS, it falls back to IndexedDB-backed persistence. On first launch the app asks the browser for persistent storage, so that the data isn't evicted under storage pressure.

## 3. Student store (logical schema)

| Table | Contents |
|---|---|
| `event` | event_id (UUID), student_id, type, payload, local timestamp, local date, timezone offset, content pack version, synced flag |
| `state_topic` | topic_id, θ, attempts (derived cache) |
| `state_subtopic` | subtopic, P(L), status, SRS ease, interval, due date (derived cache) |
| `task_seen` | task_id, last_seen, attempts |
| `session_plan` | local date, plan (ordered step list), progress pointer |
| `cache_*` | leaderboard snapshot, class roster, duels, assignments, with fetched-at times |
| `outbox` | event_ids not yet acknowledged by the server |

**Event types:** `task_answered` (task, mode, attempt number, answer, correctness, outcome, hint used, time spent), `theory_viewed`, `session_started`, `session_completed`, `diagnostic_completed`, `duel_created`, `duel_turn_played`, `streak_freeze_used`, `settings_changed`, `class_joined`.

**Derived caches** are updated incrementally after each event. They can always be rebuilt from scratch by replaying the log. Rebuilding happens after a content pack update that changes b values, and after a restore on a new device.

## 4. Content packs

- Delivered as a versioned SQLite file plus assets, downloaded once and stored locally.
- **Updates:** on sync, the server reports the latest pack version. The app downloads it in the background and switches over atomically on the next app start, never mid-session.
- **Small updates** (b recalibration, thresholds) come as a delta table instead of a full pack.
- **Removed tasks** stay valid in history. Their events keep the task_id, and the engine ignores missing tasks when planning.

## 5. Sync protocol

1. **Trigger:** app start, return to the foreground, coming back online, end of session, and every 10 minutes while online.
2. **Push:** send outbox events in batches of up to 500. The server stores them idempotently by event_id and acknowledges the IDs. Acknowledged events leave the outbox.
3. **Pull:** request everything changed since the last sync cursor: duel updates, teacher assignments, leaderboard snapshot, roster, content version, and events from the student's *other devices*.
4. **Merge:** add the other-device events to the local log (union by event_id), then recompute the derived state. Ordering uses each event's local timestamp, with event_id as the tie-breaker.
5. **Failure:** exponential backoff (up to 30 minutes). The UI shows "Не синхронизировано" in Settings, and the `OfflineBanner` appears only after 3 failed attempts while online.

**Conflicts.** None by design. Events are immutable facts, and every aggregate is a function of the event set. Two devices practising offline on the same day simply merge. A streak day counts if either device recorded activity on that local date.

## 6. Identity and accounts

- **Student onboarding:** no email required. The student joins with a teacher's class code, plus a display name, and the device receives an anonymous account token. Optionally they can link an email or VK ID later for multi-device use. ⚠ Product decision.
- **Solo mode:** the app works fully without any account. Duels and the league are hidden until the student joins a class.
- **Recovery:** students without a linked login get a printable recovery code.

## 7. Thin serverless backend

| Function | Description |
|---|---|
| Auth | Class-code join, token issue, optional login linking |
| Event ingest | Idempotent batch insert; per-student cursor |
| Sync pull | Delta since cursor |
| Duels | Create, pair, resolve at both-played or deadline |
| Leaderboard | Weekly and all-time aggregates per school/class, refreshed every 5 minutes |
| Teacher API | Classes, assignments, mock exams, analytics (08) |
| Calibration job | Nightly item b re-estimation (05, section 4.4) |
| Content hosting | Pack files and deltas from a CDN |

Any serverless platform that offers functions plus a relational database fits. Choose a provider with data residency in Russia (see section 8).

## 8. Privacy and compliance

- Users are minors. Collect the minimum personal data: a display name and a class membership.
- Personal data of Russian citizens must be stored on servers in Russia (Federal Law 152-FZ). Choose hosting accordingly. ⚠ Legal review required.
- There is no third-party analytics or advertising SDK. Telemetry is limited to the event log the product already needs.
- Students can export or delete their data from Settings. Deletion removes the server copy and wipes the local stores.

## 9. Portability

The engine and stores are platform-neutral. The same engine and the same SQLite schemas can later run inside a native shell (e.g. an Expo / React Native app using native SQLite) without changing the algorithms. Only the storage adapter and the UI layer change.

## 10. Performance budgets

- First load (cold, online): app shell ≤ 300 KB compressed; content pack downloaded in the background.
- Repeat launch offline: interactive in ≤ 1.5 s on a mid-range phone.
- Engine: session plan generation ≤ 50 ms; answer → feedback ≤ 100 ms.
- Storage: content pack ≤ 15 MB, including figures; event log ≈ 1 MB per year of daily use.
