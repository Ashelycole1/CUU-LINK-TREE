import 'dart:io';

import 'package:event_tree/core/notifications/notification_service.dart';
import 'package:event_tree/core/util/format.dart';
import 'package:event_tree/data/models/saved_event.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_timezone/flutter_timezone.dart';
import 'package:timezone/data/latest_all.dart' as tzdata;
import 'package:timezone/timezone.dart' as tz;

/// Reminders through `flutter_local_notifications`.
///
/// Scheduling is **inexact** on purpose: an inexact alarm needs no
/// `SCHEDULE_EXACT_ALARM` permission (plan §5.3), and a reminder that
/// lands a few minutes late is fine for "your event is tomorrow".
class LocalNotificationService implements NotificationService {
  /// Creates the service. Nothing happens until [initialize].
  new({FlutterLocalNotificationsPlugin? plugin})
    : _plugin = plugin ?? FlutterLocalNotificationsPlugin();

  /// The channel reminders are posted on. Android shows its name in
  /// settings, so it reads as something a person chose.
  static const String remindersChannelId = 'event_tree_reminders';

  /// The channel "New event from @host" alerts are posted on.
  static const String newEventsChannelId = 'event_tree_new_events';

  /// Where the time zone database falls back to when the phone will not
  /// say. Everyone this app is for is in Kampala (plan §5.1).
  static const String fallbackTimeZone = 'Africa/Kampala';

  final FlutterLocalNotificationsPlugin _plugin;
  bool _ready = false;

  @override
  Future<void> initialize() async {
    if (_ready) return;
    await _initializeTimeZone();
    await _plugin.initialize(
      settings: const InitializationSettings(
        android: AndroidInitializationSettings('@mipmap/ic_launcher'),
        iOS: DarwinInitializationSettings(
          // Asked for on the first Save or Follow, not on launch.
          requestAlertPermission: false,
          requestBadgePermission: false,
          requestSoundPermission: false,
        ),
      ),
    );
    _ready = true;
  }

  @override
  Future<bool> requestPermission() async {
    await initialize();
    if (Platform.isIOS) {
      final granted = await _plugin
          .resolvePlatformSpecificImplementation<
            IOSFlutterLocalNotificationsPlugin
          >()
          ?.requestPermissions(alert: true, badge: true, sound: true);
      return granted ?? false;
    }
    final android = _plugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    return await android?.requestNotificationsPermission() ?? false;
  }

  @override
  Future<bool> hasPermission() async {
    await initialize();
    if (!Platform.isAndroid) return true;
    final android = _plugin
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    return await android?.areNotificationsEnabled() ?? false;
  }

  @override
  Future<void> scheduleReminders(SavedEvent event) async {
    await initialize();
    await cancelReminders(event.id);
    final start = event.startsAtLocal;
    if (start == null) return;
    for (var slot = 0; slot < reminderLeadTimes.length; slot++) {
      final at = start.subtract(reminderLeadTimes[slot]);
      if (!at.isAfter(DateTime.now())) continue;
      await _schedule(
        id: reminderId(event.id, slot),
        at: at,
        title: event.title,
        body: _reminderBody(event, slot),
        payload: '/${event.username}/${event.slug}',
      );
    }
  }

  @override
  Future<void> cancelReminders(String eventId) async {
    await initialize();
    for (var slot = 0; slot < reminderLeadTimes.length; slot++) {
      await _plugin.cancel(id: reminderId(eventId, slot));
    }
  }

  @override
  Future<void> showNow({
    required int id,
    required String title,
    required String body,
    String? payload,
  }) async {
    await initialize();
    await _plugin.show(
      id: id,
      title: title,
      body: body,
      notificationDetails: _details(newEventsChannelId),
      payload: payload,
    );
  }

  @override
  Future<void> cancelAll() async {
    await initialize();
    await _plugin.cancelAll();
  }

  Future<void> _schedule({
    required int id,
    required DateTime at,
    required String title,
    required String body,
    String? payload,
  }) async {
    await _plugin.zonedSchedule(
      id: id,
      title: title,
      body: body,
      scheduledDate: tz.TZDateTime.from(at, tz.local),
      notificationDetails: _details(remindersChannelId),
      // Inexact: no SCHEDULE_EXACT_ALARM permission needed, and it
      // still fires while the phone is idle.
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      payload: payload,
    );
  }

  static NotificationDetails _details(String channelId) => NotificationDetails(
    android: AndroidNotificationDetails(
      channelId,
      channelId == remindersChannelId ? 'Event reminders' : 'New events',
      channelDescription: channelId == remindersChannelId
          ? 'Reminders for events you saved.'
          : 'New events from hosts you follow.',
    ),
    iOS: const DarwinNotificationDetails(),
  );

  static String _reminderBody(SavedEvent event, int slot) {
    final start = event.startsAtLocal;
    final where = event.venue.isNotEmpty ? ' · ${event.venue}' : '';
    if (start == null) return 'Coming up$where';
    final time = Format.time(start);
    return slot == 0 ? 'Tomorrow at $time$where' : 'Starts at $time$where';
  }

  Future<void> _initializeTimeZone() async {
    tzdata.initializeTimeZones();
    try {
      final name = await FlutterTimezone.getLocalTimezone();
      tz.setLocalLocation(tz.getLocation(name.identifier));
    } on Exception catch (error) {
      debugPrint('Falling back to $fallbackTimeZone: $error');
      tz.setLocalLocation(tz.getLocation(fallbackTimeZone));
    }
  }
}

/// The app's one notification service.
final notificationServiceProvider = Provider<NotificationService>(
  (ref) => LocalNotificationService(),
);
