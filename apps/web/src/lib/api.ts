import { EventTreeClient } from "@event-tree/api-client";
import { SessionStore } from "./SessionStore";

/** Same origin in development (Vite proxies /api); VITE_API_URL in production. */
const baseUrl = import.meta.env.VITE_API_URL || window.location.origin;

export const adminKeyStore = new SessionStore<string>("event-tree:admin-key", "");

/** Builds a client per call so a newly entered admin key takes effect at once. */
export function api(): EventTreeClient {
  return new EventTreeClient({ baseUrl, adminKey: adminKeyStore.get() || undefined });
}
