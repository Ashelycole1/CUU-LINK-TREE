import { EventTreeClient } from "@event-tree/api-client";

/** Set EXPO_PUBLIC_API_URL in apps/mobile/.env (see .env.example for emulator and device addresses). */
export const api = new EventTreeClient({
  baseUrl: process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000",
});
