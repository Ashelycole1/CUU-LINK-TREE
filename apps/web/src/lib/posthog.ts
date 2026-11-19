import posthog from "posthog-js";

const key = (import.meta.env.VITE_POSTHOG_KEY as string | undefined)?.trim();
const host = (import.meta.env.VITE_POSTHOG_HOST as string | undefined)?.trim() || "https://us.i.posthog.com";

/**
 * PostHog for the web app, on the free tier, sharing one project with
 * the Flutter app so both show up in the same funnels (plan §6).
 *
 * No key means no analytics, and that is a normal way to run: most
 * development builds and every fork have none. `posthog-js` keeps its
 * API available when uninitialised, so callers never have to check.
 */
if (key) {
  posthog.init(key, {
    api_host: host,
    // Session replay stays off (plan §6). The mobile allowance is small,
    // and recording people's screens is not something to switch on
    // without asking first.
    disable_session_recording: true,
    capture_exceptions: {
      capture_unhandled_errors: true,
      capture_unhandled_rejections: true,
      capture_console_errors: false,
    },
    logs: {
      serviceName: "event-tree-web",
      environment: import.meta.env.MODE,
    },
  });
} else if (import.meta.env.DEV) {
  // eslint-disable-next-line no-console
  console.info("VITE_POSTHOG_KEY is not set, so no analytics are sent.");
}

export { posthog };
