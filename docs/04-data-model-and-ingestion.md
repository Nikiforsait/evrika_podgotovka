# 04 — Data Model and Ingestion

Ingestion is a **build-time** pipeline. It reads the Excel problem banks, validates and normalizes them, and produces a versioned **content pack**: a read-only SQLite database that ships to every device. Nothing is parsed from Excel at runtime.

## 1. Source format

One or more `.xlsx` files, one row per task. Expected columns (header names are matched case-insensitively, with surrounding spaces trimmed):

| Column | Meaning | Required | Notes |
|---|---|---|---|
| `номер` | Topic ID (OGE task number) | yes | Integer 1–19 for Part 1 |
| `тип` | Sub-topic ID within the topic | yes | Integer or short code |
| `сложность` | Difficulty | yes | `0`, `слабый`, `средний`, `ОГЭ` (see section 2) |
| `условие` | Problem condition | yes | May contain inline math and a figure reference |
| `вопрос` | The question asked | yes | |
| `формат ответа` | Answer format | yes | `ввод` (input), `выбор` (multiple choice), `соответствие` (matching). English equivalents are accepted |
| `варианты` | Options | for choice and matching | Separator: `;`, newline or `\|` (open question 5) |
| `подсказка` | Hint | recommended | Shown after the first wrong attempt |
| `решение` | Worked solution | yes | Step-by-step |
| **`ответ`** | **Correct answer** | **yes — missing from the brief** | Open question 1. Fallback: mark the correct option in `варианты` with a leading `*` |
| `рисунок` (optional) | Figure file name | no | Image is placed in the content pack's assets |

## 2. Difficulty normalization

| Raw value (case/space-insensitive) | Level | Label | Initial IRT difficulty b₀ |
|---|---|---|---|
| `0`, `слабый`, `базовый` | L1 | Basic | −1.0 |
| `средний`, `1` | L2 | Intermediate | 0.0 |
| `ОГЭ`, `огэ`, `2` | L3 | Exam | +1.0 |
| anything else | — | **Rejected**, reported in the validation report | — |

b₀ is only the starting difficulty. It is recalibrated over time (05, section 4.4).

## 3. Answer-key normalization

| Format | Stored answer | How a student answer is checked |
|---|---|---|
| Input | Canonical value: integer, decimal or fraction | Trim spaces; accept a comma or a dot as the decimal separator; accept a leading minus or a typographic minus; compare numerically with tolerance 1e-9. Fractions like `3/4` are accepted only if the task allows them. Several accepted answers can be separated with `;` |
| Multiple choice | Option index (1-based) | Exact index match. Options are shuffled for display, but the mapping keeps the original index |
| Matching | Ordered digit string, OGE-style, e.g. `312` | Compared digit by digit. Each pair is scored for feedback, but the task is correct only if all pairs match |

## 4. Math normalization

The raw text uses ad-hoc notation. The pipeline converts it into one canonical math markup (a TeX subset) that the app renders with a math typesetting component. Rules, applied in order:

1. `a**5`, `a^5` → superscript: a⁵
2. `sqrt(x)`, `√x` → square root
3. `a/b` inside a formula context → fraction (only when both sides are numbers or simple terms; plain prose like "км/ч" is left untouched)
4. `*` between factors → `·`; `<=`, `>=`, `!=` → `≤`, `≥`, `≠`
5. Decimal comma is preserved for display (Russian convention)
6. Units, degrees (°) and percentages stay as text

Every converted string is rendered once at build time. If the renderer reports an error, the task is rejected, with the row number in the report.

## 5. Topic dictionary

A small configuration table supplied by the content team maps IDs to names and order:

- **Topic:** `номер` → display name (e.g. 9 → "Уравнения"), short name for chips (e.g. "Проценты", "Площади", "Графики"), sort order, OGE Part (1 or 2).
- **Sub-topic:** (`номер`, `тип`) → display name, sequence order within the topic, prerequisite sub-topics (optional).

Rows whose topic or sub-topic is not in the dictionary are rejected.

## 6. Grouping and output hierarchy

Topic → Sub-topic → Level pool (L1/L2/L3) → Tasks, where:
- Topics are ordered by the dictionary sort order.
- Sub-topics are ordered by sequence order. This order drives "next uncompleted sub-topic" in sessions.
- Within a pool, tasks are kept in source order and get a stable ID derived from content: a hash of topic, sub-topic, condition, question and answer. The ID survives re-imports, so student history stays attached to the right task.

**Minimum pool sizes** (warnings, not errors): each sub-topic should have ≥ 6 L1, ≥ 10 L2 and ≥ 6 L3 tasks, so that lessons, reviews, duels and mock exams don't repeat too soon. The report lists the shortfalls.

## 7. Theory card extraction

Each sub-topic needs 1–2 theory cards.

1. **Candidates.** Take all hints and the first step of every solution in the sub-topic. Split them into sentences. Keep sentences that contain a formula or a rule marker ("формула", "правило", "=", "если … то").
2. **Rank.** Count how often equivalent sentences appear, after normalizing whitespace and math. The most frequent rule is the core rule of the sub-topic.
3. **Compose.** The card has a title (sub-topic name), a rule (1–2 sentences), a formula block, and a mini-example taken from the simplest L1 task with its solution.
4. **Review.** Cards are drafts. An editor approves or rewrites each one in the review sheet (AI drafting is allowed here, at build time only). Only approved cards enter the content pack. If a sub-topic has no approved card, the build fails.

## 8. Content pack schema (logical)

| Table | Key fields |
|---|---|
| `pack_meta` | version, build date, source file checksums, OGE thresholds config |
| `topic` | topic_id, name, short_name, order, part |
| `subtopic` | topic_id, subtopic_id, name, order, prerequisites |
| `task` | task_id, topic_id, subtopic_id, level, b₀, condition, question, format, options, hint, solution, answer, figure_ref |
| `theory_card` | card_id, topic_id, subtopic_id, title, rule, formula, example_task_id |
| `asset` | asset_id, mime type, bytes (figures) |

The content pack is immutable on the device. Student data lives in a separate local database (07, section 3).

## 9. Validation report

Every build produces a human-readable report:
- Rows rejected, with the reason and row number (missing answer, unknown difficulty, render error, answer not among the options, duplicate ID).
- Pool-size warnings per sub-topic.
- Sub-topics without approved theory cards.
- A diff against the previous pack: tasks added, removed and changed.

A pack is publishable only when there are zero errors.
