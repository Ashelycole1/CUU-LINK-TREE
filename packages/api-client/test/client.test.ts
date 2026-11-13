import { describe, expect, it } from "vitest";
import { ApiError, EventTreeClient, Format, NeonAuthSession, type FetchLike, type SessionStore } from "../src";

function fakeFetch(status: number, body: unknown, headers: Record<string, string> = {}) {
  const calls: { url: string; init?: RequestInit }[] = [];
  const fetch: FetchLike = async (url, init) => {
    calls.push({ url, init });
    return new Response(status === 204 ? null : JSON.stringify(body), { status, headers });
  };
  return { fetch, calls };
}

describe("EventTreeClient", () => {
  it("builds versioned URLs with query strings and skips empty params", async () => {
    const { fetch, calls } = fakeFetch(200, []);
    const client = new EventTreeClient({ baseUrl: "http://api.test/", fetch });
    await client.listPageEvents("jazzfest", { when: "past", q: "", category: "Tech" });
    expect(calls[0]!.url).toBe("http://api.test/api/v1/pages/jazzfest/events?when=past&category=Tech");
  });

  it("sends JSON bodies and the bearer token from getToken", async () => {
    const { fetch, calls } = fakeFetch(201, { id: "1" });
    const client = new EventTreeClient({ baseUrl: "http://api.test", fetch, getToken: () => "abc" });
    await client.addReview("my event", { authorName: "A", rating: 5 });
    expect(calls[0]!.url).toBe("http://api.test/api/v1/events/my%20event/reviews");
    expect(calls[0]!.init?.headers).toMatchObject({ "content-type": "application/json", authorization: "Bearer abc" });
    await client.reorderEvents(["b", "a"]);
    expect(calls[1]).toMatchObject({ url: "http://api.test/api/v1/me/events/order", init: { method: "PUT" } });
    expect(JSON.parse(String(calls[0]!.init?.body))).toEqual({ authorName: "A", rating: 5 });
  });

  it("awaits an async getToken and uploads raw image bytes with their type", async () => {
    const { fetch, calls } = fakeFetch(201, { url: "https://x/media/u/1/a.png" });
    const client = new EventTreeClient({ baseUrl: "http://api.test", fetch, getToken: async () => "jwt" });
    const bytes = new Uint8Array([1, 2, 3]);
    expect(await client.uploadImage(bytes, "image/png")).toEqual({ url: "https://x/media/u/1/a.png" });
    expect(calls[0]!.url).toBe("http://api.test/api/v1/me/uploads");
    expect(calls[0]!.init?.headers).toMatchObject({ "content-type": "image/png", authorization: "Bearer jwt" });
    expect(calls[0]!.init?.body).toBe(bytes);

    await client.uploadEventPhoto("e1", bytes, "image/jpeg", "  Front row ");
    expect(calls[1]!.url).toBe("http://api.test/api/v1/events/e1/photos?caption=Front%20row");
  });

  it("turns error bodies into ApiError with field and Retry-After", async () => {
    const { fetch } = fakeFetch(429, { error: { code: "RATE_LIMIT", message: "Slow down", field: "x" } }, { "retry-after": "30" });
    const client = new EventTreeClient({ baseUrl: "http://api.test", fetch });
    const error = await client.getMyProfile().catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 429, code: "RATE_LIMIT", field: "x", retryAfterSeconds: 30 });
  });

  it("reports network failures as status 0", async () => {
    const client = new EventTreeClient({
      baseUrl: "http://api.test",
      fetch: async () => {
        throw new TypeError("failed to fetch");
      },
    });
    const error = (await client.getMyProfile().catch((e: unknown) => e)) as ApiError;
    expect(error.isNetwork).toBe(true);
  });
});

describe("NeonAuthSession", () => {
  function memoryStore(initial: string | null = null): SessionStore & { value: string | null } {
    const store = {
      value: initial,
      load: async () => store.value,
      save: async (v: string | null) => {
        store.value = v;
      },
    };
    return store;
  }
  const jwt = (exp: number) => `h.${btoa(JSON.stringify({ exp })).replace(/=+$/, "")}.s`;

  it("keeps the session from the proxy header and sends it back", async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    const store = memoryStore();
    const auth = new NeonAuthSession({
      baseUrl: "http://api.test/",
      store,
      fetch: async (url, init) => {
        calls.push({ url, init });
        if (url.endsWith("/sign-in/email"))
          return new Response(JSON.stringify({ user: { id: "u1", email: "a@b.c", name: "A" } }), { headers: { "x-auth-session": "sess.1" } });
        return new Response(JSON.stringify({ token: jwt(Date.now() / 1000 + 900) }));
      },
    });

    expect(await auth.signIn({ email: "a@b.c", password: "pw" })).toMatchObject({ id: "u1" });
    expect(calls[0]!.url).toBe("http://api.test/api/auth/sign-in/email");
    expect(calls[0]!.init?.headers).toMatchObject({ "x-auth-transport": "session" });
    expect(store.value).toBe("sess.1");

    const token = await auth.token();
    expect(calls[1]!.init?.headers).toMatchObject({ "x-auth-session": "sess.1" });
    expect(await auth.token()).toBe(token);
    expect(calls).toHaveLength(2); // cached until it nears expiry
  });

  it("returns null and forgets the session when Neon Auth rejects it", async () => {
    const store = memoryStore("stale");
    const auth = new NeonAuthSession({ baseUrl: "http://api.test", store, fetch: async () => new Response("{}", { status: 401 }) });
    expect(await auth.token()).toBeNull();
    expect(store.value).toBeNull();
  });

  it("words Better Auth errors for people", async () => {
    const auth = new NeonAuthSession({
      baseUrl: "http://api.test",
      store: memoryStore(),
      fetch: async () => new Response(JSON.stringify({ code: "INVALID_EMAIL_OR_PASSWORD", message: "Invalid" }), { status: 401 }),
    });
    await expect(auth.signIn({ email: "a@b.c", password: "x" })).rejects.toMatchObject({ status: 401, message: "That email and password don't match." });
  });
});

describe("Format", () => {
  const event = { startsAt: "2026-11-21T07:00:00Z", endsAt: "2026-11-21T13:00:00Z" };

  it("counts down, then reports live and ended", () => {
    expect(Format.countdown(event, new Date("2026-11-19T05:00:00Z"))).toBe("in 2d 2h");
    expect(Format.countdown(event, new Date("2026-11-21T06:15:00Z"))).toBe("in 45m");
    expect(Format.countdown(event, new Date("2026-11-21T08:00:00Z"))).toBe("Happening now");
    expect(Format.countdown(event, new Date("2026-11-22T00:00:00Z"))).toBe("Ended");
  });

  it("renders star strings", () => {
    expect(Format.stars(4.5)).toBe("★★★★★");
    expect(Format.stars(3.2)).toBe("★★★☆☆");
  });
});
