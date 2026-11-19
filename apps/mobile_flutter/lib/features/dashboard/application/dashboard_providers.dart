import 'dart:typed_data';

import 'package:event_tree/core/analytics/analytics_events.dart';
import 'package:event_tree/core/analytics/posthog_analytics.dart';
import 'package:event_tree/data/models/analytics_summary.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:event_tree/data/models/profile.dart';
import 'package:event_tree/data/providers/public_pages.dart';
import 'package:event_tree/data/repositories/dashboard_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Every event the signed-in host owns, hidden ones included.
final FutureProvider<List<EventDto>> myEventsProvider =
    FutureProvider<List<EventDto>>(
      (ref) => ref.watch(dashboardRepositoryProvider).listMyEvents(),
    );

/// The signed-in host's own page settings.
final myProfileProvider = FutureProvider<ProfileDto>(
  (ref) => ref.watch(dashboardRepositoryProvider).getMyProfile(),
);

/// How many days of numbers the analytics screen is showing.
class AnalyticsDays extends Notifier<int> {
  /// The stretches a host can pick between.
  static const List<int> choices = [7, 14, 30];

  @override
  int build() => 14;

  /// How many days are being shown.
  int get days => state;

  /// Shows this many days instead.
  set days(int value) => state = value;
}

/// How many days of numbers the analytics screen is showing.
final analyticsDaysProvider = NotifierProvider<AnalyticsDays, int>(
  AnalyticsDays.new,
);

/// Views and clicks for the chosen stretch of days.
final myAnalyticsProvider = FutureProvider<AnalyticsSummaryDto>(
  (ref) => ref
      .watch(dashboardRepositoryProvider)
      .getAnalytics(days: ref.watch(analyticsDaysProvider)),
);

/// Changing a host's own events and page.
///
/// Every method re-reads the list afterwards, and clears the public
/// page from the cache, so the host's own page shows the change the
/// moment they look at it.
class DashboardActions {
  /// Acts through [_ref].
  const new(this._ref);

  final Ref _ref;

  /// Posts a new event.
  Future<EventDto> createEvent(Map<String, dynamic> input) async {
    final event = await _repository.createEvent(input);
    await _track(AnalyticsEvents.eventCreated, event);
    _invalidate();
    return event;
  }

  /// Changes an event.
  Future<EventDto> updateEvent(
    String eventId,
    Map<String, dynamic> patch,
  ) async {
    final event = await _repository.updateEvent(eventId, patch);
    await _track(AnalyticsEvents.eventUpdated, event);
    _invalidate();
    return event;
  }

  /// Shows or hides an event on the public page, without deleting it.
  Future<void> setHidden(String eventId, {required bool hidden}) async {
    await _repository.updateEvent(eventId, {'hidden': hidden});
    _invalidate();
  }

  /// Deletes an event for good.
  Future<void> deleteEvent(String eventId) async {
    await _repository.deleteEvent(eventId);
    _invalidate();
  }

  /// Sets the order the events appear in.
  Future<void> reorder(List<String> ids) async {
    await _repository.reorderEvents(ids);
    _invalidate();
  }

  /// Changes the page's look or details.
  Future<ProfileDto> updateProfile(Map<String, dynamic> patch) async {
    final profile = await _repository.updateMyProfile(patch);
    _invalidate();
    return profile;
  }

  /// Uploads a picture and returns the address to save on a profile or
  /// an event.
  Future<String> uploadImage({
    required Uint8List bytes,
    required String contentType,
  }) => _repository.uploadImage(bytes: bytes, contentType: contentType);

  DashboardRepository get _repository => _ref.read(dashboardRepositoryProvider);

  /// The category only: a title is the host's words, not a statistic.
  Future<void> _track(String name, EventDto event) => _ref
      .read(analyticsProvider)
      .track(name, properties: {'category': event.category});

  void _invalidate() {
    _ref
      ..invalidate(myEventsProvider)
      ..invalidate(myProfileProvider)
      ..invalidate(hostPageProvider);
  }
}

/// The one way to change a host's own events and page.
final dashboardActionsProvider = Provider<DashboardActions>(
  DashboardActions.new,
);
