import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * A tiny document store: one JSON file holding a value of type T.
 *
 * - Reads are cached after the first load.
 * - Writes are serialised through a promise chain, so two requests can
 *   never interleave and corrupt the file.
 * - Each write goes to a temp file and is then renamed over the original,
 *   so a crash mid-write leaves the old file intact.
 */
export class JsonFileStore<T> {
  private cache: T | null = null;
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly filePath: string,
    private readonly initial: () => T,
  ) {}

  async read(): Promise<T> {
    if (this.cache !== null) return this.cache;
    try {
      this.cache = JSON.parse(await fs.readFile(this.filePath, "utf8")) as T;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      this.cache = this.initial();
    }
    return this.cache;
  }

  /** Applies `change` to the current value and persists the result atomically. */
  update(change: (current: T) => T): Promise<void> {
    const run = this.queue.then(async () => {
      const next = change(await this.read());
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      const tmp = `${this.filePath}.${process.pid}.tmp`;
      await fs.writeFile(tmp, JSON.stringify(next, null, 2), "utf8");
      await fs.rename(tmp, this.filePath);
      this.cache = next;
    });
    this.queue = run.catch(() => undefined);
    return run;
  }
}
