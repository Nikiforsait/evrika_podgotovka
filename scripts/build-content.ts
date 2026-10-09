// Build-time content pipeline: expands parameterized templates and practical
// scenarios into tasks, adds rule-based distractors, and writes a gzipped JSON pack.
// Run: node scripts/build-content.ts   (validate with: npm run validate)
import { mkdirSync, writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { scenarios } from '../content/scenarios/index.ts';
import { templates } from '../content/templates/index.ts';
import type { AnswerFormat, ContentPack, Level, Task, TaskDraft, TaskTag } from '../content/types.ts';
import { buildOptions } from '../src/lib/errors.ts';
import { parseRational, toCanonical } from '../src/lib/rational.ts';
import { createRng, shuffle } from '../src/lib/rng.ts';

const VARIANTS_PER_TEMPLATE = 14;
/** Scenario instances per level; each instance yields five linked tasks (1–5). */
const INSTANCES_PER_SCENARIO = 8;
const BASE_RATING = { 0: 720, 1: 850, 2: 1000, 3: 1150 } as const;

const tasks: Task[] = [];
const problems: string[] = [];
const ids = new Set<string>();

interface Meta {
  id: string;
  templateId: string;
  topicId: string;
  level: Level;
  format: AnswerFormat;
  scenarioKey?: string;
  tag?: TaskTag;
}

/** Turn a draft into a stored task (answer canonicalised, distractors built). Null when the answer is not clean. */
function finalize(draft: TaskDraft, meta: Meta, rng: () => number): Task | null {
  const answer = parseRational(draft.answer);
  if (!answer) {
    problems.push(`${meta.id}: answer "${draft.answer}" is not a clean number`);
    return null;
  }
  // Drop misconception paths that coincide with the answer or each other for these parameters.
  const seenWrong = new Set([toCanonical(answer)]);
  const wrongPaths = draft.wrong.filter((w) => {
    const r = parseRational(w.value);
    const k = r ? toCanonical(r) : '';
    if (!r || seenWrong.has(k)) return false;
    seenWrong.add(k);
    return true;
  });
  const task: Task = {
    ...draft,
    ...meta,
    wrong: wrongPaths,
    answer: draft.display === 'digits' ? draft.answer : toCanonical(answer),
    // Small spread inside a level so the Elo selector has something to choose from.
    rating: BASE_RATING[meta.level] + Math.round((rng() - 0.5) * 80),
  };
  if (meta.format === 'choice') {
    // Pre-built labelled options keep their order for 2-way (да/нет); 4-way sets are shuffled.
    task.options = draft.options
      ? draft.options.length > 2 ? shuffle(rng, draft.options) : draft.options
      : buildOptions(task.answer, wrongPaths, rng);
  }
  return task;
}

const isRetry = (err: unknown) => (err as Error).message === 'retry';

for (const tpl of templates) {
  if (ids.has(tpl.id)) problems.push(`duplicate template id ${tpl.id}`);
  ids.add(tpl.id);
  const seen = new Set<string>();
  for (let i = 0; i < VARIANTS_PER_TEMPLATE * 4 && seen.size < VARIANTS_PER_TEMPLATE; i++) {
    const rng = createRng(`${tpl.id}#${i}`);
    let draft: TaskDraft;
    try {
      draft = tpl.generate(rng);
    } catch (err) {
      if (isRetry(err)) continue; // the random draw did not fit the constraints
      problems.push(`${tpl.id}#${i}: ${(err as Error).message}`);
      break;
    }
    const key = `${draft.text}|${draft.question}|${draft.figure ?? ''}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const id = `${tpl.id}-${String(seen.size).padStart(2, '0')}`;
    const task = finalize(draft, { id, templateId: tpl.id, topicId: tpl.topicId, level: tpl.level, format: tpl.format, tag: tpl.tag }, rng);
    if (task) tasks.push(task);
  }
  if (seen.size < 4) problems.push(`${tpl.id}: only ${seen.size} distinct variant(s)`);
}

for (const sc of scenarios) {
  if (ids.has(sc.id)) problems.push(`duplicate scenario id ${sc.id}`);
  ids.add(sc.id);
  for (const level of sc.levels ?? ([1, 2, 3] as const)) {
    const seen = new Set<string>();
    for (let i = 0; i < INSTANCES_PER_SCENARIO * 6 && seen.size < INSTANCES_PER_SCENARIO; i++) {
      const rng = createRng(`${sc.id}#L${level}#${i}`);
      let parts;
      try {
        parts = sc.generate(rng, level);
      } catch (err) {
        if (isRetry(err)) continue;
        problems.push(`${sc.id} L${level}#${i}: ${(err as Error).message}`);
        break;
      }
      const key = parts.map((p) => `${p.draft.text}|${p.draft.question}`).join('||');
      if (seen.has(key)) continue;
      seen.add(key);
      const scenarioKey = `${sc.id}-L${level}-${String(seen.size).padStart(2, '0')}`;
      for (const p of parts) {
        const task = finalize(p.draft, { id: `${scenarioKey}-${p.topicId}`, templateId: `${sc.id}-${p.topicId}`, topicId: p.topicId, level, format: p.format, scenarioKey, tag: sc.tag }, rng);
        if (task) tasks.push(task);
      }
    }
    if (seen.size < 4) problems.push(`${sc.id} L${level}: only ${seen.size} distinct instance(s)`);
  }
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}

const pack: ContentPack = {
  version: new Date().toISOString().slice(0, 10),
  builtAt: new Date().toISOString(),
  tasks,
};
const json = JSON.stringify(pack);

mkdirSync('content/generated', { recursive: true });
mkdirSync('public/content', { recursive: true });
writeFileSync('content/generated/tasks.json', JSON.stringify(pack, null, 2));
const gz = gzipSync(json, { level: 9 });
writeFileSync('public/content/tasks.json.gz', gz);

const byTopic = tasks.reduce<Record<string, number>>((acc, t) => {
  acc[t.topicId] = (acc[t.topicId] ?? 0) + 1;
  return acc;
}, {});
console.log(`Built ${tasks.length} tasks from ${templates.length} templates and ${scenarios.length} scenarios`);
console.log(Object.entries(byTopic).map(([k, v]) => `${k}:${v}`).join(' '));
console.log(`with figures: ${tasks.filter((t) => t.figure).length}, with tables: ${tasks.filter((t) => t.table).length}, scenario tasks: ${tasks.filter((t) => t.scenarioKey).length}`);
console.log(`JSON ${(json.length / 1024).toFixed(1)} KB → gzip ${(gz.length / 1024).toFixed(1)} KB`);
