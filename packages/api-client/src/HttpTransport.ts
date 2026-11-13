import { ApiError } from "./ApiError";

export type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export interface TransportOptions {
  baseUrl: string;
  fetch?: FetchLike;
  /** Returns the Neon Auth JWT to send as `Authorization: Bearer`, or null when signed out. Read on every request. */
  getToken?: () => string | null | undefined | Promise<string | null | undefined>;
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

  put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("PUT", path, body);
  }

  patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>("PATCH", path, body);
  }

  delete(path: string): Promise<void> {
    return this.request<void>("DELETE", path);
  }

  /** Sends a file as the raw request body (uploads), with its own content type. */
  upload<T>(path: string, file: Blob | ArrayBuffer | Uint8Array, contentType: string, query?: Record<string, string | undefined>): Promise<T> {
    return this.request<T>("POST", path + toQueryString(query), { raw: file, contentType });
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const headers: Record<string, string> = { accept: "application/json" };
    let requestBody: BodyInit | undefined;
    if (isRaw(body)) {
      headers["content-type"] = body.contentType;
      requestBody = body.raw as BodyInit;
    } else if (body !== undefined) {
      headers["content-type"] = "application/json";
      requestBody = JSON.stringify(body);
    }
    const token = await this.options.getToken?.();
    if (token) headers.authorization = `Bearer ${token}`;

    // Uploads get longer: a 5 MB photo on a phone connection takes a while.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), (this.options.timeoutMs ?? 15_000) * (isRaw(body) ? 4 : 1));
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.baseUrl}${path}`, { method, headers, body: requestBody, signal: controller.signal });
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

interface RawBody {
  raw: Blob | ArrayBuffer | Uint8Array;
  contentType: string;
}

function isRaw(body: unknown): body is RawBody {
  return typeof body === "object" && body !== null && "raw" in body && "contentType" in body;
}

function toQueryString(query?: Record<string, string | number | undefined>): string {
  if (!query) return "";
  const parts = Object.entries(query)
    .filter(([, v]) => v !== undefined && v !== "")
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
  return parts.length ? `?${parts.join("&")}` : "";
}
