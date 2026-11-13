import { EventTreeClient } from "@event-tree/api-client";

/**
 * The session token lives in memory, so a host logs in again after the app
 * restarts. Swap in expo-secure-store to keep it between launches.
 */
let token: string | null = null;
export const session = {
  get: () => token,
  set: (value: string | null) => {
    token = value;
  },
};

/**
 * The deployed Event Tree address, e.g. https://eventtree.onrender.com.
 * One server answers both the API and the public web pages, so the same
 * address builds shareable links. Set EXPO_PUBLIC_API_URL in apps/mobile/.env
 * (see .env.example). Development falls back to the local API; a release
 * build without it would talk to nothing, so it fails loudly instead.
 */
const configured = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/+$/, "");
if (!configured && !__DEV__) throw new Error("EXPO_PUBLIC_API_URL is not set for this build.");
export const BASE_URL = configured || "http://localhost:4000";

export const api = new EventTreeClient({ baseUrl: BASE_URL, getToken: () => session.get() });

/** A public web link, e.g. webUrl("jazzfest", "opening-night") → https://…/jazzfest/opening-night. */
export function webUrl(...parts: string[]): string {
  return [BASE_URL, ...parts.map(encodeURIComponent)].join("/");
}

/** The address without the scheme, for labels like "eventtree.onrender.com/". */
export const WEB_HOST = BASE_URL.replace(/^https?:\/\//, "");
