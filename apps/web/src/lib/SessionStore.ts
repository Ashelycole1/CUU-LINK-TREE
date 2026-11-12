/**
 * One typed value in sessionStorage. Linktree keeps its transient
 * navigation state the same way (see docs/reverse-engineering).
 * Every access is wrapped because storage can be blocked (private mode,
 * embedded previews); the app then falls back to the default.
 */
export class SessionStore<T> {
  constructor(
    private readonly key: string,
    private readonly fallback: T,
  ) {}

  get(): T {
    try {
      const raw = window.sessionStorage.getItem(this.key);
      return raw === null ? this.fallback : (JSON.parse(raw) as T);
    } catch {
      return this.fallback;
    }
  }

  set(value: T): void {
    try {
      window.sessionStorage.setItem(this.key, JSON.stringify(value));
    } catch {
      /* storage unavailable: keep working without persistence */
    }
  }
}
