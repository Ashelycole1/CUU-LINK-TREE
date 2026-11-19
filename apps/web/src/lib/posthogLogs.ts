import { posthog } from "./posthog";

type LogAttributes = Record<string, boolean | number | string>;

export const posthogLogs = {
  info(message: string, attributes: LogAttributes) {
    try {
      posthog.logger.info(message, attributes);
    } catch {}
  },
};
