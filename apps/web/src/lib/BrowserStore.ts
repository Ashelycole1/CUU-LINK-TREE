/**
 * One typed value in localStorage or sessionStorage. Every access is wrapped
 * because storage can be blocked (private mode, embedded previews); the app
 * then keeps working with the fallback value.
 */
export class BrowserStore<T> {
  constructor(
    private readonly key: string,
    private readonly fallback: T,
    private readonly kind: "local" | "session" = "local",
  ) {}

  private get storage(): Storage {
    return this.kind === "local" ? window.localStorage : window.sessionStorage;
  }

  get(): T {
    try {
      const raw = this.storage.getItem(this.key);
      return raw === null ? this.fallback : (JSON.parse(raw) as T);
    } catch {
      return this.fallback;
    }
  }

  set(value: T): void {
    try {
      this.storage.setItem(this.key, JSON.stringify(value));
    } catch {
      /* storage unavailable: keep working without persistence */
    }
  }

  clear(): void {
    try {
      this.storage.removeItem(this.key);
    } catch {
      /* ignore */
    }
  }
}
