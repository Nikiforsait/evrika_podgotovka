# 03 — Screens and Component Hierarchies

## 1. Responsive layout

| Breakpoint | Width | Navigation | Content layout |
|---|---|---|---|
| Mobile | < 640 px | Bottom nav bar (4 items) | Single column, full-width cards |
| Tablet | 640–1023 px | Collapsed side rail (icons only) | Single column, max width 640 px, centered |
| Desktop | ≥ 1024 px | Expanded side rail (icon + label) | Two-column grid: main column (2/3) and side panel (1/3) |

**Rules**
- Screens are designed mobile-first, translated from the reference frames. Larger layouts add columns. They never add features.
- The Quiz screen stays single-column at every width (max 720 px) to keep focus.
- Tap targets are at least 44 × 44 px.
- The app background gradient covers the full viewport. Cards scroll over it.

**Global navigation items:** Home (Главная), Duels (Дуэли), Profile (Профиль), Settings (Настройки). Teachers get a separate Teacher Console (08).

**Global overlays:** `OfflineBanner` (shown only while offline or when sync fails), `Toast` (XP gained, streak saved, duel finished).

## 2. Screen: Dashboard (Home)

**Purpose:** answer "How am I doing, and what do I do today?" in one glance.

**Component hierarchy**
- `AppShell`
  - `NavBar`
  - `DashboardPage`
    - `ProfileHeader`
      - `Avatar` (72)
      - Name and class
      - `LevelBadge`, e.g. "Level 80"
      - `XPBar`, e.g. "14 XP", with progress to the next level
      - `StreakCounter`, e.g. "7 days", with 7 day dots
    - `TodayCard` (primary call to action)
      - Title "План на сегодня" and estimated minutes
      - Session step list: Streak · Review (n) · New topic · Duel
      - `Button` primary "Начать" or "Продолжить"
    - `PathTo19Card`
      - `MilestoneTrack` (5 nodes: see 06, section 5)
      - Predicted score "Прогноз: 14 / 19" and the next milestone label
    - `TopicMasteryCard`
      - List of `TopicRow`: topic name (e.g. Percentages, Areas, Charts), `ProgressBar` with mastery %, and the status color and label (02, section 8)
      - Link "Все темы"
    - (Desktop side panel) `LeaderboardPreview` (top 3 plus your position), `ActiveDuelsPreview`

**States:**
- *First launch:* the Path and Mastery cards are replaced by a "Пройди диагностику" call to action that opens Diagnostics Intro.
- *Session completed today:* the TodayCard shows a check and "Бонусная практика".
- *Offline:* identical, with the banner shown and the leaderboard marked "обновлено <time>".

## 3. Screen: Duels & Leaderboard

**Component hierarchy**
- `DuelsPage`
  - `Button` primary "Новая дуэль" (sticky on mobile)
  - `Section` "Активные дуэли"
    - `DuelCard` × n: both avatars, names, score so far, status (your turn / waiting / finished), deadline
  - `Section` "Лига школы"
    - Segmented control: Неделя / Всё время
    - `LeaderboardRow` × n: rank, `Avatar`, name, XP, movement arrow (▲▼ vs last week)
    - Current user row pinned at the bottom if it's outside the visible list
  - `Section` "Челленджи"
    - `ChallengeCard` × n: title (e.g. "5 верных подряд"), progress, XP reward

**New duel flow:** choose opponent (classmate list, or "Случайный соперник" from the class) → the duel is created with a shared seed → you play your 5 tasks immediately (works offline) → the result is stored and submitted on next sync → the opponent plays → both are notified in-app on next sync.

**States:** no class joined → explain that duels need a class code and link to Profile. Offline → "Новая дуэль" still works, but the opponent list comes from the cached roster, and a note says the result will be sent later.

## 4. Screen: Diagnostics Intro

**Component hierarchy**
- `DiagnosticsIntroPage`
  - Target icon (large, glowing)
  - `h1` "Диагностика"
  - Subtitle: "≈ 15 минут · 19 заданий · первая часть ОГЭ" ⚠ (see open question 3; the brief says 5 minutes and 20 questions)
  - Bullet list: what you get (predicted score, weak topics, personal plan)
  - `Button` primary "Начать"
  - Caption with the offline icon: "Работает без интернета"

**Rules:** the diagnostic can be retaken every 14 days (configurable). Before the first diagnostic, the session engine uses default priors (05, section 4).

## 5. Screen: Quiz Interface

Used by diagnostics, lessons, reviews, duels and mock exams. A `mode` setting changes only the feedback behavior.

**Component hierarchy**
- `QuizPage`
  - `QuizHeader`: close (×), `ProgressBar` (question i of n), mode label; in duel mode, the opponent's avatar; in timed mode, a timer
  - `QuestionCard`
    - Topic and sub-topic caption
    - Condition text (`условие`) with rendered math and an optional figure
    - Question text (`вопрос`)
  - `AnswerArea`, by answer format:
    - Multiple choice → `AnswerOption` × n (labelled 1–4, keyboard keys 1–4)
    - Input → `NumericInput` with the accepted format hint ("Ответ: число или десятичная дробь")
    - Matching → `MatchingGrid` (rows А/Б/В, each with a choice of 1–n)
  - `QuizFooter`: `Button` ghost "Подсказка" (lightbulb), `Button` primary "Проверить"
  - `FeedbackSheet` (slides up from the bottom)

**Feedback behavior by mode**

| Mode | Hint button | After answering |
|---|---|---|
| Lesson / Review | Available | Full feedback loop (05, section 3) |
| Diagnostics | Hidden | No feedback per question. A neutral "Ответ принят", then next |
| Duel | Hidden | Correct/incorrect only. Solutions are shown after the duel |
| Mock exam | Hidden | No feedback until submission. Then a full review |

**Feedback sheet (lesson mode):**
- *Correct:* green sheet, check icon, "Верно! +10 XP", the step-by-step solution (`решение`) collapsed under "Как решать", then "Дальше".
- *First wrong attempt:* amber sheet showing the hint (`подсказка`) and "Попробовать ещё".
- *Second wrong attempt:* red sheet showing the correct answer, the full solution, and "Дальше".

**Keyboard:** Enter = check or next; 1–4 = choose an option; H = hint; Esc = exit (with a confirmation if progress would be lost).

## 6. Screen: Diagnostics Results

**Component hierarchy**
- `DiagnosticsResultsPage`
  - `ProgressRing`: "14 из 19" in the center, "74% верно" below. The percentage is shown as reported correct/total. Note that 14/19 is 73.7%, so the app rounds half up and shows 74%.
  - Predicted grade label (e.g. "Прогноз: «4»"), from the configurable thresholds (06, section 5)
  - `TopicBreakdownCard`: a list of `TopicRow` (Percentages, Areas, Charts…) with the status color (green = mastered, yellow = needs review, red = weak) and per-topic score, e.g. "2/2"
  - `Button` primary "Начать тренировку" → generates the first session with the weakest topics first
  - `Button` secondary (pink) "Справочные материалы" → the reference library (theory cards grouped by topic)

## 7. Supporting screens

- **Profile:** avatar, name, class code (join or change), stats (total XP, longest streak, tasks solved, time spent), achievements, reference library entry.
- **Settings:** daily goal (10 / 15 / 20 min), reminder time (local notifications where supported), theme (dark only in v1), reduced motion, sound, data and sync status ("Последняя синхронизация"), export or delete my data, log out.
- **Session runner:** a wrapper that walks the student through the session steps (06, section 1), with a step indicator at the top and a summary screen at the end (XP earned, mastery changes, streak status).
- **Reference library:** all theory cards by topic. Fully offline.
