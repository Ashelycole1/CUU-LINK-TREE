import 'dart:async';
import 'dart:typed_data';

import 'package:event_tree/core/analytics/analytics.dart';
import 'package:event_tree/core/analytics/analytics_events.dart';
import 'package:event_tree/core/analytics/posthog_analytics.dart';
import 'package:event_tree/core/network/api_error.dart';
import 'package:event_tree/core/util/links.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:event_tree/data/models/review.dart';
import 'package:event_tree/data/providers/public_pages.dart';
import 'package:event_tree/data/repositories/event_actions_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Every review of one event, in the order the server returns them.
// The type is `FutureProviderFamily`, which flutter_riverpod 3 does not
// export, so it cannot be written down here.
// ignore: specify_nonobvious_property_types
final eventReviewsProvider = FutureProvider.family<List<ReviewDto>, String>(
  (ref, eventId) => eventId.isEmpty
      ? Future<List<ReviewDto>>.value(const [])
      : ref.watch(eventActionsRepositoryProvider).listReviews(eventId),
);

/// Counts a tap on one of an event's links, then opens it.
///
/// The count is what the host sees in their dashboard. It is sent
/// without waiting, so a slow network never delays the browser opening,
/// and a failed count never stops the link.
Future<bool> openEventLink(
  EventActionsRepository repository, {
  required String eventId,
  required String url,
  required EventLinkKind kind,
  Analytics analytics = const NoopAnalytics(),
}) {
  unawaited(_countClick(repository, eventId));
  unawaited(
    analytics.track(
      AnalyticsEvents.eventLinkClicked,
      properties: {'link_kind': kind.wire},
    ),
  );
  return Links.open(url);
}

/// Leaves a review and re-reads the event, so the rating on the page
/// updates with it.
Future<void> submitReview(
  WidgetRef ref, {
  required String eventId,
  required EventKey key,
  required String authorName,
  required int rating,
  String comment = '',
}) async {
  await ref
      .read(eventActionsRepositoryProvider)
      .addReview(
        eventId,
        authorName: authorName,
        rating: rating,
        comment: comment,
      );
  // The rating, never the words (plan §6).
  await ref
      .read(analyticsProvider)
      .track(AnalyticsEvents.reviewAdded, properties: {'rating': rating});
  ref
    ..invalidate(eventReviewsProvider(eventId))
    ..invalidate(pageEventProvider(key));
}

/// Adds a visitor's photo to the gallery and re-reads the event.
Future<void> uploadPhoto(
  WidgetRef ref, {
  required String eventId,
  required EventKey key,
  required Uint8List bytes,
  required String contentType,
  String caption = '',
}) async {
  await ref
      .read(eventActionsRepositoryProvider)
      .uploadEventPhoto(
        eventId,
        bytes: bytes,
        contentType: contentType,
        caption: caption,
      );
  await ref.read(analyticsProvider).track(AnalyticsEvents.photoUploaded);
  ref.invalidate(pageEventProvider(key));
}

Future<void> _countClick(
  EventActionsRepository repository,
  String eventId,
) async {
  try {
    await repository.recordClick(eventId);
  } on ApiError {
    return;
  }
}
