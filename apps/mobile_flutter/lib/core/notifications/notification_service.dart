import 'package:event_tree/data/models/saved_event.dart';

/// Reminders and alerts, as the rest of the app sees them.
///
/// Everything on-device: local scheduled notifications and background
/// sync, no server and no Firebase (plan §5). Keeping the plugin behind
/// this interface means no screen ever calls it directly, and tests can
/// use a fake.
abstract interface class NotificationService {
  /// Prepares the plugin and the time zone database. Safe to call more
  /// than once.
  Future<void> initialize();

  /// Asks for permission to post notifications, returning whether it
  /// was granted.
  ///
  /// Android 13 and later need this. It is asked the first time someone
  /// taps Save or Follow, never on launch (plan §5.3).
  Future<bool> requestPermission();

  /// Whether notifications are allowed right now.
  Future<bool> hasPermission();

  /// Schedules the two reminders for [event]: one a day before it
  /// starts, one an hour before. Reminders already in the past are
  /// skipped, and any earlier pair for the same event is replaced.
  Future<void> scheduleReminders(SavedEvent event);

  /// Drops both reminders for [eventId].
  Future<void> cancelReminders(String eventId);

  /// Shows something immediately, used by background sync for
  /// "New event from @host".
  Future<void> showNow({
    required int id,
    required String title,
    required String body,
    String? payload,
  });

  /// Drops everything scheduled. Used when notifications are turned off
  /// in Settings.
  Future<void> cancelAll();
}

/// A stable notification id for one reminder.
///
/// [slot] 0 is the day-before reminder and 1 the hour-before one, so
/// re-saving an event replaces its reminders instead of stacking them.
/// The result stays inside the 32-bit range Android requires.
int reminderId(String eventId, int slot) =>
    ((eventId.hashCode & 0x3FFFFFFF) * 2 + slot) & 0x7FFFFFFF;

/// A stable notification id for "a new event from this host".
int newEventId(String eventId) =>
    (((eventId.hashCode & 0x3FFFFFFF) * 2 + 1) ^ 0x5A5A5A5) & 0x7FFFFFFF;

/// How long before an event each reminder fires (plan §5.1).
const List<Duration> reminderLeadTimes = [
  Duration(days: 1),
  Duration(hours: 1),
];
