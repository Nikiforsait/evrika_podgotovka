# 05 — Lesson Generation Engine

The engine is a set of deterministic, pure functions that run on the device. Inputs are the content pack plus the student's local state. Outputs are lesson plans and state updates. There is no network and no AI at runtime.

## 1. Engine state per student

| State | Granularity | Purpose |
|---|---|---|
| θ (ability) | per topic | Adaptive task selection and predicted score (section 4) |
| P(L) (mastery) | per sub-topic | Mastery display, lesson completion, statuses (section 5) |
| SRS card | per sub-topic | Review scheduling (section 6) |
| Seen-task history | per task | Avoid repeats |
| Item difficulty b | per task (local copy) | Starts at b₀ and is refined by pack updates (4.4) |

## 2. Lesson assembly (≈ 10–15 minutes)

A lesson always targets one sub-topic.

| Slot | Content | Default level | Est. time |
|---|---|---|---|
| 1. Theory | 1 theory card (2 if it's the first lesson of a topic) | — | 1–2 min |
| 2. Warm-up | 1 task | L1 | 1–2 min |
| 3. Core A | 1 task | L2 | 2–3 min |
| 4. Core B | 1 task | L2 | 2–3 min |
| 5. Challenge | 1 task | L3 | 3–4 min |
| 6. Duel task | 1 task, played against a classmate's recorded attempt (06, section 6) | L2 | 1–2 min |

**Task selection within a slot**
1. Candidate pool: tasks of the sub-topic at the slot's level.
2. Remove tasks seen in the last 14 days. If the pool becomes empty, allow the least recently seen.
3. Score each candidate by how close its predicted success probability P(θ, b) is to the target of **0.75** (section 4.2). Choose the closest one; break ties by least-recently-seen, then by stable ID.
4. **Slot shifting (adaptive):** the slot level can move by at most one level based on what happened earlier in the lesson.
   - Warm-up wrong after the hint → Core A drops to L1.
   - Both Core tasks correct on the first attempt → Challenge stays L3. If θ is already above the L3 pool's average b by more than 1.0, pick the hardest L3 task.
   - Both Core tasks wrong → Challenge becomes L2. The lesson is marked "repeat recommended".
5. **Answer-format variety:** if possible, avoid three tasks in a row with the same format.

**Lesson completion:** the lesson is complete when all slots are answered. The sub-topic counts as "learned" for session sequencing when P(L) ≥ 0.80 (section 5). Otherwise the next session repeats it with fresh tasks.

## 3. Feedback loop

Lesson and review mode, per task:

1. The student submits an answer.
2. **Correct on the first attempt** → green feedback card and the full `решение`. Outcome = 1.0.
3. **Incorrect on the first attempt** → the `подсказка` is shown (amber) and the student may try again.
   - Correct on the second attempt → green card and the full `решение`. Outcome = 0.5.
   - Incorrect on the second attempt → red card, the correct answer and the full `решение`. Outcome = 0.0.
4. **Hint pressed before answering** counts like a first wrong attempt for scoring: the maximum outcome becomes 0.5.
5. If a task has no hint, a wrong first attempt goes straight to step 3's final branch.
6. Multiple choice with 2 options allows only one attempt, because a second attempt would be a guaranteed answer.

The outcome value (1.0 / 0.5 / 0.0) feeds the Elo update (section 4). The binary correctness used by mastery (section 5) counts only a correct first attempt with no hint.

## 4. Adaptive difficulty (Elo with an IRT probability model)

### 4.1 Scale
θ and b share one logistic (1PL / Rasch) scale. θ is tracked **per topic**, because ability on Percentages says little about Geometry.

### 4.2 Success probability
P(correct) = 1 / (1 + e^−(θ − b)).

### 4.3 Update after each scored task (outcome s ∈ {0, 0.5, 1})
- θ_new = θ + K_student × (s − P)
- K_student = 0.4 / (1 + 0.05 × n), where n = attempts on this topic, with a floor of 0.1. Learning is fast at first and stable later.
- **Diagnostic mode** uses a bigger K (0.6) and no floor decay, so one test gives a usable estimate.
- **Initial θ** before any data is −0.5, slightly below L2. After the diagnostic, θ comes from that topic's diagnostic answers.

### 4.4 Item calibration
- On the device, b is **not** changed, so one student can't distort the item.
- On the server, a nightly aggregate re-estimates each task's b from all synced attempts using the same Elo rule, with K_item = 0.05 and a minimum of 30 attempts.
- New b values ship in the next content pack update as a small table, not a full re-download.

### 4.5 Next-task rule
For any free choice (review tasks, bonus practice, the challenge-slot override), pick the task whose P is closest to 0.75 among unseen candidates. Targeting about 75% success keeps practice in the "desirable difficulty" zone while keeping motivation high.

## 5. Mastery: Bayesian Knowledge Tracing (per sub-topic)

Parameters (global defaults; can be tuned per sub-topic later):

| Parameter | Meaning | Default |
|---|---|---|
| P(L₀) | Prior mastery | 0.20 (or set from the diagnostic: 0.60 if correct, 0.10 if wrong) |
| P(T) | Chance of learning per opportunity | 0.15 |
| P(S) | Chance of a slip when mastered | 0.10 |
| P(G) | Chance of a guess when not mastered | input 0.05; choice 1 / number of options; matching 1 / (number of permutations) or 0.05, whichever is larger |

**Update per task** (correct = a correct first attempt with no hint):
- If correct: P(L | obs) = P(L)(1 − S) / [P(L)(1 − S) + (1 − P(L))G]
- If incorrect: P(L | obs) = P(L)S / [P(L)S + (1 − P(L))(1 − G)]
- Then learning: P(L)_new = P(L | obs) + (1 − P(L | obs)) × T

**Thresholds:** ≥ 0.95 mastered · ≥ 0.80 learned (unlocks the next sub-topic) · < 0.60 with ≥ 3 attempts = weak. Statuses map to colors in 02, section 8.

**Lesson-end "mastery update"** (step 4 of the source algorithm) is simply the sequence of these per-task updates. A summary of the before and after values is shown on the session summary screen.

## 6. Spaced repetition (per sub-topic)

The SRS schedules **sub-topics**, not individual tasks. Each review shows a new task from that sub-topic, which prevents memorizing answers.

- A card is created when a sub-topic first reaches "learned".
- **Grade** for a review task: first-attempt correct = Good; correct after the hint = Hard; wrong = Again.
- **Intervals** follow a simplified SM-2:
  - Ease starts at 2.5 (range 1.3–3.0).
  - Good → interval × ease. Hard → interval × 1.2 and ease − 0.15. Again → interval resets to 1 day and ease − 0.2.
  - The first intervals are 1, 3 and 7 days.
- **Review task level** = the highest level where P ≥ 0.6, so reviews stretch the student without crushing them.
- **Due cards** are those with a due date ≤ today (local date). If more than 7 are due, take the 7 with the lowest P(L) first. The rest roll over.
- An "Again" grade also lowers P(L) through the BKT incorrect update.

## 7. Determinism and testing

- All randomness (option shuffling, duel task sets, mock exams) uses a seeded generator. Seeds come from student ID + date + context. Re-opening a session shows the same plan.
- The engine must have a golden-file test suite: given a fixed content pack and event history, the generated plan and state must match exactly.
