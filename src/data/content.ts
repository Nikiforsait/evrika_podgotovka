// Loads the gzipped content pack. The service worker precaches it, so this
// works offline after the first visit.
import type { ContentPack, Task } from '../../content/types.ts';

let cache: Promise<Task[]> | null = null;

async function decode(res: Response): Promise<ContentPack> {
  const bytes = new Uint8Array(await res.arrayBuffer());
  const isGzip = bytes[0] === 0x1f && bytes[1] === 0x8b;
  // Some servers decompress transparently; only inflate when the magic bytes are present.
  if (!isGzip) return JSON.parse(new TextDecoder().decode(bytes)) as ContentPack;
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
  return (await new Response(stream).json()) as ContentPack;
}

function loadAll(): Promise<Task[]> {
  cache ??= fetch(`${import.meta.env.BASE_URL}content/tasks.json.gz`)
    .then((res) => {
      if (!res.ok) throw new Error(`Content pack: HTTP ${res.status}`);
      return decode(res);
    })
    .then((pack) => pack.tasks)
    .catch((err: unknown) => {
      cache = null;
      throw err;
    });
  return cache;
}

/** Tasks for training, duels and the full diagnostic (the short-diagnostic set is excluded). */
export async function loadTasks(): Promise<Task[]> {
  return (await loadAll()).filter((t) => t.tag !== 'quick');
}

/** The dedicated set for the short starting diagnostic. */
export async function loadQuickTasks(): Promise<Task[]> {
  return (await loadAll()).filter((t) => t.tag === 'quick');
}

export async function taskById(id: string): Promise<Task | undefined> {
  return (await loadAll()).find((t) => t.id === id);
}
