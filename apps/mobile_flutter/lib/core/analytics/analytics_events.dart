/// The event names web and app both send to PostHog (plan §6).
///
/// One list, used by `apps/web/src/lib/analyticsEvents.ts` as well, so
/// a funnel is not split in two by a spelling difference. Adding a name
/// means adding it in both places.
///
/// Nothing here ever carries an email, a name or review text: the free
/// tier is for counting what people do, not for recording who they are.
abstract final class AnalyticsEvents {
  /// A screen was opened. Property: `screen`.
  static const String pageViewed = 'page_viewed';

  /// An event's own page was opened. Property: `event_status`.
  static const String eventOpened = 'event_opened';

  /// One of an event's links was tapped. Property: `link_kind`.
  static const String eventLinkClicked = 'event_link_clicked';

  /// An event was saved. Property: `event_status`.
  static const String eventSaved = 'event_saved';

  /// Reminders were scheduled for a saved event. Property: `lead_hours`.
  static const String reminderScheduled = 'reminder_scheduled';

  /// A host was followed.
  static const String hostFollowed = 'host_followed';

  /// A review was left. Property: `rating`. Never the words.
  static const String reviewAdded = 'review_added';

  /// A photo was added to an event's gallery.
  static const String photoUploaded = 'photo_uploaded';

  /// An account was created.
  static const String signedUp = 'signed_up';

  /// A handle was claimed, which creates the page.
  static const String usernameClaimed = 'username_claimed';

  /// A host posted an event.
  static const String eventCreated = 'event_created';

  /// A host changed an event.
  static const String eventUpdated = 'event_updated';

  /// Something threw. Properties: `type` and a short `message`.
  static const String appError = 'app_error';

  /// Every name above, for the test that keeps web and app in step.
  static const List<String> all = [
    pageViewed,
    eventOpened,
    eventLinkClicked,
    eventSaved,
    reminderScheduled,
    hostFollowed,
    reviewAdded,
    photoUploaded,
    signedUp,
    usernameClaimed,
    eventCreated,
    eventUpdated,
    appError,
  ];
}
