import { describe, expect, it } from "vitest";
import { ApiError, EventTreeClient, Format, type FetchLike } from "../src";

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
