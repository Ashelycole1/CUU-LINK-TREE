/**
 * A one-shot message handed from one screen to the next, e.g. "this event was
 * just published" from the add-event modal back to the dashboard. take()
 * reads it once and clears it, so it never shows twice.
 */
let pending: string | null = null;

export const flash = {
  set(value: string) {
    pending = value;
  },
  take(): string | null {
    const value = pending;
    pending = null;
    return value;
  },
};
