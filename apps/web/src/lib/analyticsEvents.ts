/**
 * The event names web and app both send to PostHog.
 *
 * The twin of `apps/mobile_flutter/lib/core/analytics/analytics_events.dart`
 * (plan §6). One list, so a funnel is never split in two by a spelling
 * difference. Adding a name means adding it in both places.
 *
 * Nothing here ever carries an email, a name or review text: the free
 * tier is for counting what people do, not for recording who they are.
 */
export const ANALYTICS_EVENTS = {
  /* ---------- plan §6: the shared core ---------- */
  /** A screen or page was opened. Property: `screen`. */
  pageViewed: "page_viewed",
  /** An event's own page was opened. Property: `event_status`. */
  eventOpened: "event_opened",
  /** One of an event's links was followed. Properties: `link_kind`, `event_status`. */
  eventLinkClicked: "event_link_clicked",
  /** An event was saved for later. Property: `event_status`. App only, for now. */
  eventSaved: "event_saved",
  /** Reminders were scheduled for a saved event. Property: `lead_hours`. App only. */
  reminderScheduled: "reminder_scheduled",
  /** A host was followed. App only. */
  hostFollowed: "host_followed",
  /** A review was left. Property: `rating`. Never the words. */
  reviewAdded: "review_added",
  /** A photo was added to an event's gallery. */
  photoUploaded: "photo_uploaded",
  /** An account was created. */
  signedUp: "signed_up",
  /** A handle was claimed, which creates the page. */
  usernameClaimed: "username_claimed",
  /** A host posted an event. Property: `category`. */
  eventCreated: "event_created",
  /** A host changed an event. Property: `category`. */
  eventUpdated: "event_updated",
  /** Something threw. Properties: `type` and a short `message`. */
  appError: "app_error",

  /* ---------- both apps do these too ---------- */
  /** Somebody logged back in. */
  signedIn: "signed_in",
  /** An emailed sign-up code was accepted. */
  emailVerified: "email_verified",
  /** An event was added to a phone or desktop calendar. Property: `event_status`. */
  calendarExported: "calendar_exported",
  /** A host changed how their page looks. Property: `theme_id`. */
  profileUpdated: "profile_updated",
  /** A host showed or hid an event. */
  eventVisibilityChanged: "event_visibility_changed",
  /** A host deleted an event. */
  eventDeleted: "event_deleted",
} as const;

/** One of the names above. */
export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS];
