import * as SecureStore from "expo-secure-store";
import { EventTreeClient, NeonAuthSession, type SessionStore } from "@event-tree/api-client";

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

/** The Neon Auth session, kept in the device keychain so hosts stay signed in. */
const SESSION_KEY = "event-tree.neon-session";
const keychain: SessionStore = {
  load: () => SecureStore.getItemAsync(SESSION_KEY),
  save: (value) => (value ? SecureStore.setItemAsync(SESSION_KEY, value) : SecureStore.deleteItemAsync(SESSION_KEY)),
};

/** Sign-up, sign-in and sign-out with Neon Auth, through the server's /api/auth proxy. */
export const auth = new NeonAuthSession({ baseUrl: BASE_URL, store: keychain });

/** Every API request carries a fresh Neon Auth JWT when someone is signed in. */
export const api = new EventTreeClient({ baseUrl: BASE_URL, getToken: () => auth.token() });

/** A public web link, e.g. webUrl("jazzfest", "opening-night") → https://…/jazzfest/opening-night. */
export function webUrl(...parts: string[]): string {
  return [BASE_URL, ...parts.map(encodeURIComponent)].join("/");
}

/** The address without the scheme, for labels like "eventtree.onrender.com/". */
export const WEB_HOST = BASE_URL.replace(/^https?:\/\//, "");
