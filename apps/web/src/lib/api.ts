import { createAuthClient } from "@neon/auth";
import { EventTreeClient } from "@event-tree/api-client";

/** Same origin by default: Vite proxies /api in development, and the API serves this app in production. */
const baseUrl = (import.meta.env.VITE_API_URL || window.location.origin).replace(/\/+$/, "");

/**
 * Neon Auth, reached through the API's same-origin /api/auth proxy so the
 * session cookie is first-party. The SDK caches the session, and its JWT,
 * until the JWT is about to expire.
 */
export const authClient = createAuthClient(`${baseUrl}/api/auth`);

/** The Neon Auth JWT for the signed-in person, or null. */
async function neonJwt(): Promise<string | null> {
  try {
    const { data } = await authClient.getSession();
    return data?.session?.token ?? null;
  } catch {
    return null;
  }
}

/** One shared client; it asks Neon Auth for the current JWT on every request. */
export const api = new EventTreeClient({ baseUrl, getToken: neonJwt });

// Tokens from the old built-in log-in are no longer used.
try {
  window.localStorage.removeItem("event-tree:token");
} catch {
  // storage blocked: nothing to clean up
}

/** The public address of a page on the current origin, e.g. "event-tree.onrender.com/jazzfest". */
export function pageUrl(username: string): { href: string; label: string } {
  const href = `${window.location.origin}/${username}`;
  return { href, label: href.replace(/^https?:\/\//, "") };
}
