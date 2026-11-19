import 'package:event_tree/core/analytics/analytics_events.dart';
import 'package:event_tree/core/analytics/posthog_analytics.dart';
import 'package:event_tree/core/network/api_error.dart';
import 'package:event_tree/core/notifications/local_notification_service.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:event_tree/data/models/saved_event.dart';
import 'package:event_tree/data/repositories/pages_repository.dart';
import 'package:event_tree/data/repositories/saved_repository.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// What the phone has kept: saved events and followed hosts.
///
/// This lives in `data/` rather than in the Saved feature because three
/// features need it: an event is saved from the event screen, a host is
/// followed from their page, and the Saved tab lists both.
@immutable
class SavedState {
  /// Creates a snapshot of the phone's own store.
  const new({this.events = const [], this.following = const []});

  /// Saved events, soonest first.
  final List<SavedEvent> events;

  /// The handles being followed.
  final List<String> following;

  /// The saved events still to come.
  List<SavedEvent> get upcoming =>
      events.where((event) => !event.isOver).toList();

  /// The saved events that have finished, most recent first.
  List<SavedEvent> get past =>
      events.where((event) => event.isOver).toList().reversed.toList();

  /// Whether [eventId] is saved.
  bool isSaved(String eventId) => events.any((event) => event.id == eventId);

  /// Whether [username] is followed.
  bool isFollowing(String username) => following.contains(username);

  /// Whether nothing has been saved or followed yet.
  bool get isEmpty => events.isEmpty && following.isEmpty;
}

/// Saving, following and the reminders that go with them.
///
/// The notification permission is asked for here, the first time
/// someone saves or follows something, rather than on launch (plan
/// §5.3). Saving still works if they say no; they just get no reminder.
class SavedController extends AsyncNotifier<SavedState> {
  @override
  Future<SavedState> build() async {
    final repository = await ref.watch(savedRepositoryProvider.future);
    return _read(repository);
  }

  /// Saves [event] if it is not saved, forgets it if it is, and
  /// schedules or cancels its reminders to match.
  ///
  /// Returns whether the event is saved afterwards, so the screen can
  /// say "Saved. We'll remind you" or "Removed".
  Future<bool> toggleSave(EventDto event, {required String username}) async {
    if (event.id.isEmpty) return false;
    final repository = await ref.read(savedRepositoryProvider.future);
    final notifications = ref.read(notificationServiceProvider);
    final nowSaved = !repository.isSaved(event.id);
    if (nowSaved) {
      final allowed = await notifications.requestPermission();
      final saved = event.toSaved(username);
      await repository.save(saved);
      await notifications.scheduleReminders(saved);
      final analytics = ref.read(analyticsProvider);
      await analytics.track(
        AnalyticsEvents.eventSaved,
        properties: {'event_status': event.status.wire},
      );
      if (allowed) {
        await analytics.track(
          AnalyticsEvents.reminderScheduled,
          properties: {'lead_hours': 24},
        );
      }
    } else {
      await repository.remove(event.id);
      await notifications.cancelReminders(event.id);
    }
    state = AsyncData(_read(repository));
    return nowSaved;
  }

  /// Follows or unfollows [username].
  ///
  /// Following records what the host has posted *now*, so the first
  /// background sync only announces what comes after this moment.
  Future<bool> toggleFollow(String username) async {
    if (username.isEmpty) return false;
    final repository = await ref.read(savedRepositoryProvider.future);
    final notifications = ref.read(notificationServiceProvider);
    final nowFollowing = !repository.isFollowing(username);
    if (nowFollowing) {
      await notifications.requestPermission();
      await repository.follow(username);
      await _recordBaseline(repository, username);
      await ref.read(analyticsProvider).track(AnalyticsEvents.hostFollowed);
    } else {
      await repository.unfollow(username);
    }
    state = AsyncData(_read(repository));
    return nowFollowing;
  }

  /// Drops a saved event from the Saved tab.
  Future<void> forget(String eventId) async {
    final repository = await ref.read(savedRepositoryProvider.future);
    await repository.remove(eventId);
    await ref.read(notificationServiceProvider).cancelReminders(eventId);
    state = AsyncData(_read(repository));
  }

  Future<void> _recordBaseline(
    SavedRepository repository,
    String username,
  ) async {
    try {
      final events = await ref
          .read(pagesRepositoryProvider)
          .listPageEvents(username, EventListQuery.upcoming);
      await repository.rememberSeen(username, {
        for (final event in events) event.id,
      });
    } on ApiError {
      // Offline: the first sync sets the baseline instead.
    }
  }

  static SavedState _read(SavedRepository repository) => SavedState(
    events: repository.savedEvents(),
    following: repository.following(),
  );
}

/// What the phone has kept, and the way to change it.
final savedProvider = AsyncNotifierProvider<SavedController, SavedState>(
  SavedController.new,
);

/// Whether one event is saved. Null until the store has been read.
bool isEventSaved(AsyncValue<SavedState> saved, String eventId) =>
    saved.value?.isSaved(eventId) ?? false;

/// Whether one host is followed. False until the store has been read.
bool isHostFollowed(AsyncValue<SavedState> saved, String username) =>
    saved.value?.isFollowing(username) ?? false;
