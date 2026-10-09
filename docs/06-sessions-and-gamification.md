# 06 — Daily Sessions and Gamification

## 1. Daily session assembly

A session is generated on the device when the student opens "План на сегодня", and it is stable for that local date.

| Step | Content | Rule |
|---|---|---|
| 1. Streak challenge | 1 quick L1 task from any learned sub-topic | Completing it **saves the streak**, so even a 1-minute visit counts. Placed first on purpose |
| 2. SRS review | 5–7 due review tasks (05, section 6) | If fewer than 5 are due, fill with tasks from the weakest learned sub-topics. If none are learned yet, skip this step |
| 3. New theory | 1–2 theory cards | From the next sub-topic in sequence (section 2) |
| 4. New practice | The lesson slots 2–5 (05, section 2): 4 tasks | Adaptive |
| 5. Duel | 1 duel task, or the next pending duel turn | See section 6 |
| 6. Progress update | Summary screen | XP earned, mastery before/after, streak, predicted score change, next milestone |

**Time budget.** The daily goal (Settings: 10, 15 or 20 min) scales step 2: 10 min → 3 reviews, 15 min → 5, 20 min → 7. Steps 1, 3, 4 and 5 always run.

**Interrupted sessions** resume where they stopped, on the same local date. After midnight, a new plan is generated, and unfinished new material carries over.

## 2. Choosing the next sub-topic

1. If a teacher assignment is active (08), the next sub-topic is the scheduled one for today.
2. Otherwise, take the topic with the **largest expected score gain**: (1 − P(correct on that topic's L3 task)) × weight. The weight is 1 for every Part 1 task number, but can be configured.
3. Within that topic, take the first sub-topic in sequence order whose prerequisites are learned and which itself is not yet learned.
4. If every sub-topic is learned, run a "mastery sprint": an L3-only lesson on the topic with the lowest θ.

After a diagnostic, rule 2 automatically starts with the weakest topics. This is what "Начать тренировку" does.

## 3. XP

XP is motivation only. It never affects mastery or the predicted score.

| Action | XP |
|---|---|
| Correct, first attempt | 10 (L1) / 15 (L2) / 20 (L3) |
| Correct after the hint | half of the above |
| Wrong (attempted seriously, i.e. not skipped) | 2 |
| Theory card read to the end | 3 |
| Session completed | 30 |
| Duel won / draw / lost | 25 / 15 / 10 |
| Challenge completed | as defined per challenge (typically 50) |
| Streak milestone (7 / 30 / 100 days) | 50 / 200 / 500 |

**Anti-farming:** XP for repeating already-mastered L1 tasks is capped at 50 per day.

## 4. Levels and streaks

- **Level curve:** XP needed for level n → n+1 = 50 + 10 × n. The level and progress bar are derived from total XP, never stored separately.
- **Streak:** a day counts when the streak challenge (or any scored task) is completed on that local calendar date.
- **Streak freeze:** 1 freeze is earned per 7-day streak (maximum 2 held). It is used automatically for a missed day.
- **Time zones:** streak days use the device's local date at the time of the event, which is recorded in the event. Sync never breaks a streak that was valid locally.

## 5. Path to 19

A five-milestone track toward the full Part 1 score. Milestones are configuration shipped in `pack_meta`, because grade thresholds change each year. ⚠ Confirm the values (open question 4).

| Milestone | Default predicted Part 1 score | Meaning |
|---|---|---|
| 1. Старт | Diagnostic taken | Starting point recorded |
| 2. Порог | 8 | Passing ("3") zone |
| 3. Уверенно | 12 | Solid "3" / approaching "4" |
| 4. Хорошо | 15 | "4" zone |
| 5. Максимум | 19 | All Part 1 tasks mastered |

**Predicted score** = the sum, over task numbers 1–19, of P(correct) on that topic's L3 tasks, using the topic's θ and the average b of its L3 pool (see 09, section 2). It is shown rounded to an integer, with a ± range in the details view. A milestone is "reached" when the predicted score crosses it. Reaching one triggers an unlock animation and XP.

## 6. Duels (asynchronous, offline-capable)

Real-time play would require a connection, so duels are **asynchronous**:

1. **Creation:** the challenger picks an opponent from their class roster (cached offline) or "random classmate". A duel has a seed, 5 tasks (L2, from sub-topics both students have learned, or else from the challenger's learned sub-topics), and a 48-hour deadline.
2. **Play:** each side plays the same 5 tasks in the same order. Scoring per task is 100 points for correct, plus up to 50 speed bonus points (linear from 0 s to 60 s), and 0 for wrong.
3. **Offline:** your turn is recorded locally and submitted on next sync. The opponent sees the duel after their next sync.
4. **Resolution:** the server compares the two attempts after both are submitted, or at the deadline. If one side didn't play, the other wins by forfeit for half XP. The result arrives on the next sync.
5. **Daily-session duel task:** if a duel turn is pending, the session's duel step plays it. Otherwise it starts a new duel with one task as a "quick duel".
6. **Fair play:** a duel's tasks are hidden until play starts. Answers can't be changed after submission. Server-side, an attempt time under 3 seconds on a non-trivial task is flagged.

## 7. School League (leaderboard)

- Ranks students within a school (and optionally a class) by **weekly XP**, with an all-time tab.
- It's computed on the server from synced events and cached on the device with an "обновлено" time.
- Shows rank, avatar, display name (first name + initial only), XP, and movement versus last week.
- Students can hide themselves from the league in Settings. They still see their own position privately.

## 8. Challenges

Rotating weekly goals, defined in content configuration, e.g. "5 верных подряд", "3 дуэли за неделю", "Повтори 10 карточек". Progress is computed locally from events. The rewards are XP and cosmetic badges.
