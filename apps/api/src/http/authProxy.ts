import express, { type Express, type Request, type Response } from "express";

/** Mounted here; the clients' Neon Auth base URL is `<origin>/api/auth`. */
export const AUTH_PROXY_PATH = "/api/auth";

const SESSION_COOKIE = "__Secure-neon-auth.session_token";
/** Mobile: send the session back on this request header; the proxy turns it into the cookie. */
export const SESSION_HEADER = "x-auth-session";
/** Mobile: set to "session" to receive the session value on SESSION_HEADER in responses. */
export const TRANSPORT_HEADER = "x-auth-transport";

const FORWARD_REQUEST_HEADERS = ["accept", "accept-language", "content-type", "cookie", "user-agent", "referer"];
const DROP_RESPONSE_HEADERS = new Set(["content-encoding", "content-length", "transfer-encoding", "connection", "keep-alive", "set-cookie"]);

/**
 * A same-origin reverse proxy in front of the branch's Neon Auth (Managed
 * Better Auth) URL, so the session cookie is first-party on our own domain
 * (Safari and other browsers block third-party cookies). This is the same
 * shape as Neon's Next.js `auth.handler()`.
 *
 * Native apps have no browser cookie jar to rely on, so they opt in to a
 * "session transport": the proxy returns the session cookie's value on the
 * x-auth-session response header and accepts it back on the same request
 * header, much like Better Auth's bearer plugin.
 *
 * Neon Auth requires an Origin from its trusted domains. Browsers send one;
 * for native requests without it, the proxy uses PUBLIC_URL, which must be a
 * trusted domain (localhost is trusted by default).
 */
export function mountAuthProxy(app: Express, settings: { baseUrl: string; publicUrl: string }): void {
  app.use(AUTH_PROXY_PATH, express.raw({ type: () => true, limit: "100kb" }), async (req: Request, res: Response) => {
    const headers = new Headers();
    for (const name of FORWARD_REQUEST_HEADERS) {
      const value = req.header(name);
      if (value) headers.set(name, value);
    }
    headers.set("origin", req.header("origin") ?? settings.publicUrl);

    const session = req.header(SESSION_HEADER)?.trim();
    if (session && /^[A-Za-z0-9._%+/=-]+$/.test(session)) {
      const cookie = headers.get("cookie");
      headers.set("cookie", [cookie, `${SESSION_COOKIE}=${session}`].filter(Boolean).join("; "));
    }

    const hasBody = !["GET", "HEAD"].includes(req.method) && Buffer.isBuffer(req.body) && req.body.length > 0;
    let upstream: globalThis.Response;
    try {
      upstream = await fetch(`${settings.baseUrl}${req.url}`, {
        method: req.method,
        headers,
        body: hasBody ? req.body : undefined,
        redirect: "manual",
        signal: AbortSignal.timeout(15_000),
      });
    } catch {
      res.status(502).json({ code: "AUTH_UNAVAILABLE", message: "Sign-in is unavailable right now. Try again in a moment." });
      return;
    }

    res.status(upstream.status);
    upstream.headers.forEach((value, name) => {
      if (!DROP_RESPONSE_HEADERS.has(name)) res.setHeader(name, value);
    });

    // Cookies become host-only cookies on our domain.
    const cookies = upstream.headers.getSetCookie().map((c) => c.replace(/;\s*Domain=[^;]*/i, ""));
    if (cookies.length) res.setHeader("set-cookie", cookies);

    if (req.header(TRANSPORT_HEADER) === "session") {
      const sessionCookie = cookies.find((c) => c.startsWith(`${SESSION_COOKIE}=`));
      if (sessionCookie) {
        const value = sessionCookie.slice(SESSION_COOKIE.length + 1).split(";")[0] ?? "";
        res.setHeader(SESSION_HEADER, /Max-Age=0/i.test(sessionCookie) ? "" : value);
      }
      res.setHeader("access-control-expose-headers", SESSION_HEADER);
    }

    res.send(Buffer.from(await upstream.arrayBuffer()));
  });
}
