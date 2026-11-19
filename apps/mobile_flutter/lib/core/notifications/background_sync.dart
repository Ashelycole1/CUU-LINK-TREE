/// Catching up on followed hosts in the background (plan §5.2).
///
/// There is no push server, so the phone checks for itself: every so
/// often the OS wakes this task, it asks each followed host for their
/// upcoming events, and anything it has not seen before becomes a
/// "New event from @host" notification. The same work runs when the app
/// opens, so opening it always catches up even if the OS has been
/// stingy with background time.
library;

import 'dart:ui';

import 'package:event_tree/core/config/env.dart';
import 'package:event_tree/core/network/api_error.dart';
import 'package:event_tree/core/network/dio_provider.dart';
import 'package:event_tree/core/notifications/local_notification_service.dart';
import 'package:event_tree/core/notifications/notification_service.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:event_tree/data/models/saved_event.dart';
import 'package:event_tree/data/repositories/pages_repository.dart';
import 'package:event_tree/data/repositories/saved_repository.dart';
import 'package:flutter/foundation.dart';
import 'package:workmanager/workmanager.dart';

/// The name the OS knows the periodic task by.
const String syncTaskName = 'event-tree-follow-sync';

/// The most often Android will run a periodic task.
const Duration syncInterval = Duration(minutes: 15);

/// Saved events further out than this are left alone by the reminder
/// refresh, to keep a background run short.
const Duration reminderHorizon = Duration(days: 30);

/// The entry point the OS calls. Must be a top-level function.
@pragma('vm:entry-point')
void backgroundSyncDispatcher() {
  Workmanager().executeTask((task, inputData) => runFollowSync());
}

/// Registers the periodic check. Called from `bootstrap`.
Future<void> registerBackgroundSync() async {
  await Workmanager().initialize(backgroundSyncDispatcher);
  await Workmanager().registerPeriodicTask(
    syncTaskName,
    syncTaskName,
    frequency: syncInterval,
    constraints: Constraints(networkType: NetworkType.connected),
    existingWorkPolicy: ExistingPeriodicWorkPolicy.keep,
  );
}

/// Stops the periodic check, for the Settings switch.
Future<void> cancelBackgroundSync() =>
    Workmanager().cancelByUniqueName(syncTaskName);

/// Looks for new events from followed hosts and keeps saved reminders
/// honest. Returns true however it goes, because telling the OS a task
/// failed only makes it retry work that is not worth retrying.
Future<bool> runFollowSync() async {
  // A background isolate starts with no plugins registered.
  DartPluginRegistrant.ensureInitialized();
  if (!Env.hasApiBaseUrl) return true;
  try {
    final saved = await SavedRepository.open();
    final notifications = LocalNotificationService();
    await notifications.initialize();
    final pages = PagesRepository(buildApiDio(origin: Env.apiBaseUrl));
    await _announceNewEvents(saved, pages, notifications);
    await _refreshReminders(saved, pages, notifications);
  } on Exception catch (error) {
    debugPrint('Background sync gave up: $error');
  }
  return true;
}

/// One notification per event a followed host has posted since last
/// time. The first run for a host only records what is there, so
/// following someone never floods the phone.
Future<void> _announceNewEvents(
  SavedRepository saved,
  PagesRepository pages,
  NotificationService notifications,
) async {
  for (final username in saved.following()) {
    try {
      final events = await pages.listPageEvents(
        username,
        EventListQuery.upcoming,
      );
      final ids = {for (final event in events) event.id};
      final seen = saved.seenEvents(username);
      if (seen.isNotEmpty) {
        for (final event in events) {
          if (seen.contains(event.id)) continue;
          await notifications.showNow(
            id: newEventId(event.id),
            title: 'New event from @$username',
            body: event.title,
            payload: '/$username/${event.slug}',
          );
        }
      }
      await saved.rememberSeen(username, ids);
    } on ApiError {
      continue;
    }
  }
}

/// Re-reads each saved event that is still ahead, and re-schedules its
/// reminders when the host has moved it.
Future<void> _refreshReminders(
  SavedRepository saved,
  PagesRepository pages,
  NotificationService notifications,
) async {
  final horizon = DateTime.now().add(reminderHorizon);
  for (final event in saved.savedEvents()) {
    final start = event.startsAtLocal;
    if (start == null || start.isAfter(horizon) || event.isOver) continue;
    try {
      final fresh = await pages.getPageEvent(event.username, event.slug);
      if (fresh.startsAt == event.startsAt && fresh.endsAt == event.endsAt) {
        continue;
      }
      final updated = fresh.toSaved(event.username);
      await saved.save(updated);
      await notifications.scheduleReminders(updated);
    } on ApiError catch (error) {
      // A deleted event stops being worth a reminder.
      if (error.isNotFound) {
        await saved.remove(event.id);
        await notifications.cancelReminders(event.id);
      }
      continue;
    }
  }
}
