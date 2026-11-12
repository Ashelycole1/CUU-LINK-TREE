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

/** Set EXPO_PUBLIC_API_URL in apps/mobile/.env (see .env.example for emulator and device addresses). */
export const api = new EventTreeClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000",
  getToken: () => session.get(),
});
