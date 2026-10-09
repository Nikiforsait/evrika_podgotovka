# 08 — Teacher Mode (B2B / School)

The Teacher Console is a separate area of the same web app, available to teacher accounts. It's designed primarily for desktop and is online-first: teachers need fresh class data. It works read-only from cache when offline.

## 1. Teacher accounts and classes

- A teacher signs up with an email, creates a school (or joins one), and creates classes (e.g. "9А").
- Each class gets a **class code**, which students enter to join (07, section 6).
- **Roster view:** student display names, last active date, streak, predicted score, and number of weak topics.

## 2. Assignment and auto-scheduling

**Step 1 — Teacher setup.** The teacher chooses:
- a topic (e.g. "Задание 9: Уравнения"), or several topics;
- a target date (e.g. the date of a class test);
- available days: weekdays by default, with excluded dates such as holidays;
- an optional daily load: light (1 sub-topic per day), normal (1–2), intensive (2–3).

**Step 2 — Auto-scheduling algorithm.**
1. Collect the topic's sub-topics in sequence order, e.g. Types 1–5.
2. Give each sub-topic a weight of 1.0, plus 0.5 if its L3 pool is larger than its L2 pool (a proxy for harder material), plus 0.5 if the class's average P(L) on it is below 0.5. Use 0 if the class has mastered it (average P(L) ≥ 0.9). Mastered sub-topics are not scheduled; they're shown as "already mastered".
3. Count the available days D between today and the target date. Reserve the last day for the mock test, which leaves D − 1 study days.
4. Distribute the sub-topics in order across the study days so that the cumulative weight per day is as even as possible (greedy fill up to the total weight divided by the number of days), never exceeding the daily-load maximum.
5. If the sub-topics don't fit, show a warning with the options: raise the daily load, move the target date, or drop the lowest-priority sub-topics.
6. The teacher can drag sub-topics between days before publishing.

**Effect on students.** Published assignments sync to the students' devices. On each scheduled day, the session's "new material" step uses the assigned sub-topic (06, section 2, rule 1). SRS reviews and duels continue as usual. A student who is behind gets the missed sub-topics first, in order.

## 3. Assessment (mock exam) generation

**Step 3 — Generation algorithm.**
1. **Blueprint:** for a full Part 1 mock, 1 task per task number 1–19. For a topic test, a teacher-chosen number of tasks per sub-topic in scope.
2. **Pool:** L3 (OGE) tasks only, excluding tasks used in this class's previous mock exams.
3. **Variants:** the teacher chooses 1–4 variants. Each variant gets different tasks for each blueprint slot where the pool allows it. If the pool is too small, tasks repeat across variants, but each variant has a different order.
4. **Randomization:** each student gets a variant, a seeded task order (within OGE structure, the full mock keeps task-number order), and shuffled answer options. The answer key is stored on the server with the seed.
5. **Delivery:** the mock is downloaded to student devices in advance, so it can be taken offline with an optional timer, and it opens at the scheduled time. Answers are hidden from the student until the teacher releases results.
6. **Scoring:** automatic, 1 point per correct Part 1 task. The predicted grade uses the configured thresholds.

## 4. Class analytics

**Step 4 — Analytics.**
- **Heatmap:** students × sub-topics, with each cell colored by P(L) status (02, section 8).
- **Error-rate table per sub-topic:** attempts, first-attempt error rate, hint usage rate, average time.
- **Focus list:** sub-topics where the class first-attempt error rate is at least 15 percentage points above the class's own average, with at least 20 attempts from at least 5 students. These are ranked by error rate × number of affected students. This answers "what should I explain in the next live lesson?"
- **Common wrong answers:** for input and choice tasks, the most frequent wrong answers per task (often revealing a specific misconception, e.g. forgetting to convert a percentage).
- **Mock exam results:** score distribution, per-task-number success rate, and comparison with the previous mock.
- **Progress over time:** the class average predicted score per week.

**Privacy:** teachers see only their own classes. Students' answers are visible to their teacher, and the app tells students this when they join a class.

## 5. Teacher Console screens

1. **Classes overview** — cards per class: student count, average predicted score, the active assignment, alerts (e.g. "4 ученика не заходили 3 дня").
2. **Class detail** — tabs: Roster · Heatmap · Focus list · Assignments · Mock exams.
3. **Assignment builder** — the steps in section 2, with a calendar preview.
4. **Mock exam builder** — blueprint, variants, schedule, timer, result release.
5. **Student detail** — the student's mastery map, predicted score trend, recent sessions, and streak.

The design uses the same token system (02). Because the console is data-dense, it uses `surface.card` tables with compact spacing (12 px). Gamification visuals are not shown here.
