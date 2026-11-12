import { ApiError } from "./ApiError";

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface TransportOptions {
  baseUrl: string;
  fetch?: FetchLike;
  /** Sent as x-admin-key on every request when set. */
  adminKey?: string;
  timeoutMs?: number;
}

/**
 * Low-level JSON over HTTP. Knows about URLs, headers, timeouts and error
 * bodies, and nothing about events. EventTreeClient builds on it.
 */
export class HttpTransport {
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;

  constructor(private readonly options: TransportOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.fetchImpl = options.fetch ?? ((input, init) => globalThis.fetch(input, init));
  }

  get<T>(path: string, query?: Record<string, string | number | undefined>): Promise<T> {
    return this.request<T>("GET", path + toQueryString(query));
  }

  post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("POST", path, body);
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  delete(path: string): Promise<void> {
    return this.request<void>("DELETE", path);
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.options.timeoutMs ?? 15_000);
    const headers: Record<string, string> = { accept: "application/json" };
    if (body !== undefined) headers["content-type"] = "application/json";
    if (this.options.adminKey) headers["x-admin-key"] = this.options.adminKey;

    let res: Response;
    try {
      res = await this.fetchImpl(`${this.baseUrl}${path}`, {
        method,
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: controller.signal,
      });
    } catch (error) {
      const aborted = (error as Error)?.name === "AbortError";
      throw new ApiError(0, aborted ? "TIMEOUT" : "NETWORK", aborted ? "The server took too long to answer." : "Could not reach the server.");
    } finally {
      clearTimeout(timer);
    }

    if (res.status === 204) return undefined as T;
    const payload: unknown = await res.json().catch(() => null);
    if (!res.ok) {
      const err = (payload as { error?: { code?: string; message?: string; field?: string } } | null)?.error;
      const retryAfter = Number(res.headers.get("retry-after"));
      throw new ApiError(
        res.status,
        err?.code ?? "HTTP_ERROR",
        err?.message ?? `Request failed with status ${res.status}.`,
        err?.field,
        Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : undefined,
      );
    }
    return payload as T;
  }
}

function toQueryString(query?: Record<string, string | number | undefined>): string {
  if (!query) return "";
  const parts = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join("&")}` : "";
}
