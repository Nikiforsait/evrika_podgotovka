# 09 — Diagnostics and Student Analytics

## 1. Diagnostic test

- **Blueprint:** 19 questions, one per Part 1 task number (open question 3), taken from the L2 pool for task numbers whose L3 pool is very hard, and from L3 otherwise. ⚠ The content team should mark which pool each task number uses.
- **Selection:** for each task number, a seeded random task from the chosen pool, excluding tasks the student has seen.
- **Mode:** no hints and no per-question feedback (03, section 5). The student can skip a question, which counts as wrong.
- **Timing:** untimed by default, with a recommended pace shown. Time per question is recorded.
- **Scoring:** the raw score is the number of correct answers out of 19; the percentage is the number correct divided by 19.

**Outputs**
1. θ per topic: starting from the default, apply the diagnostic-mode Elo update (05, section 4.3) for that topic's answer.
2. P(L₀) for each sub-topic of a tested topic: 0.60 if correct, 0.10 if wrong. Untested sub-topics keep 0.20.
3. The predicted score and the Path to 19 starting milestone.
4. The topic breakdown for the results screen (03, section 6), with statuses from P(L) and the per-topic answer.

**Retake:** allowed every 14 days. The results screen shows the change since the previous diagnostic.

## 2. Predicted score

For each Part 1 task number t:
- p_t = P(correct) = 1 / (1 + e^−(θ_t − b̄_t)), where θ_t is the topic's ability and b̄_t is the mean difficulty of the topic's exam pool.

**Predicted Part 1 score** = Σ p_t over t = 1…19.

**Uncertainty range:** the variance is Σ p_t(1 − p_t). The range shown is the predicted score ± 1.28 × √variance (roughly an 80% interval), clipped to 0–19.

**Predicted grade:** from the configured grade thresholds in `pack_meta`. Because grades depend on total points (and in some years on a geometry minimum), the grade label is shown as "прогноз" and the app explains its basis in a tooltip.

The prediction updates after every scored task, but the dashboard animates a change only at the end of a session, to avoid noise.

## 3. Student analytics dashboard

Shown in Profile → "Статистика", with summary widgets on the Dashboard.

| Widget | Content |
|---|---|
| Predicted score trend | Line over the last 8 weeks (one point per week: the end-of-week prediction) and the milestone lines |
| Topic mastery | Per topic: average P(L) of its sub-topics, status color, and the number of sub-topics mastered |
| Time spent | Minutes per day for the last 14 days (bar chart), from task time-spent events, capped at 5 minutes per task to ignore idle time |
| Accuracy | First-attempt accuracy per level (L1/L2/L3) over the last 30 days |
| Streak calendar | A month view with active days and freezes used |
| Weakest sub-topics | The top 3 by low P(L), with a "Тренировать" button that starts a lesson |

All analytics are computed locally from the event log and work offline.

## 4. Product metrics (internal)

Collected only from events that are already synced, aggregated, with no third-party tools:
- Day-1, day-7 and day-30 retention; average session length; session completion rate.
- Average predicted-score gain per 10 sessions.
- Per-task statistics: error rate, hint rate, time, discrimination. These feed content quality reviews: tasks with an error rate above 90% or below 5% at their level are flagged for the editor.
