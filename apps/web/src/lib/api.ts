import { EventTreeClient } from "@event-tree/api-client";
import { BrowserStore } from "./BrowserStore";

/** Same origin in development (Vite proxies /api); VITE_API_URL in production. */
const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;

/** The session token. Kept in localStorage so a host stays logged in across tabs. */
export const tokenStore = new BrowserStore<string | null>("event-tree:token", null);

/** One shared client; it reads the current token on every request. */
export const api = new EventTreeClient({ baseUrl, getToken: () => tokenStore.get() });

/** The public address of a page, e.g. "eventtree.app/jazzfest" or "localhost:5173/jazzfest". */
export function pageUrl(username: string): { href: string; label: string } {
  const href = `${window.location.origin}/${username}`;
  return { href, label: href.replace(/^https?:\/\//, "") };
}
