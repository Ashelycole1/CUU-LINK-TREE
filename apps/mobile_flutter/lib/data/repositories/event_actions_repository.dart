import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:event_tree/core/network/dio_provider.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:event_tree/data/models/review.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// What a visitor can do to one event: count a tap, leave a review,
/// add a photo.
///
/// One method per endpoint in `EventTreeClient.ts`, with the same
/// names. None of these needs an account: reviewing an event and
/// adding a photo to it are things any student can do (plan §0).
class EventActionsRepository {
  /// Writes through [_dio], which is already pointed at `/api/v1`.
  const new(this._dio);

  final Dio _dio;

  /// Counts one tap on an event, for the host's own analytics.
  ///
  /// Best-effort, like `recordView`: if it fails, the link still opens.
  Future<void> recordClick(String eventId) => apiCall(() async {
    await _dio.post<dynamic>(
      '/events/${_seg(eventId)}/clicks',
      data: const <String, dynamic>{},
    );
  });

  /// Every review of an event, as the server orders them.
  Future<List<ReviewDto>> listReviews(String eventId) => apiCall(() async {
    final response = await _dio.get<dynamic>(
      '/events/${_seg(eventId)}/reviews',
    );
    final data = response.data;
    if (data is! List) return const [];
    return [
      for (final item in data)
        if (item is Map<String, dynamic>) ReviewDto.fromJson(item),
    ];
  });

  /// How an event has been rated, without fetching every review.
  Future<RatingSummaryDto> getRatingSummary(String eventId) =>
      apiCall(() async {
        final response = await _dio.get<dynamic>(
          '/events/${_seg(eventId)}/reviews/summary',
        );
        return RatingSummaryDto.fromJson(_map(response.data));
      });

  /// Leaves a review. The server refuses until the event has started.
  Future<ReviewDto> addReview(
    String eventId, {
    required String authorName,
    required int rating,
    String comment = '',
  }) => apiCall(() async {
    final response = await _dio.post<dynamic>(
      '/events/${_seg(eventId)}/reviews',
      data: {
        'authorName': authorName,
        'rating': rating,
        if (comment.isNotEmpty) 'comment': comment,
      },
    );
    return ReviewDto.fromJson(_map(response.data));
  });

  /// Adds a picture to an event's gallery by link.
  Future<EventDto> addImage(
    String eventId, {
    required String url,
    String alt = '',
    String caption = '',
  }) => apiCall(() async {
    final response = await _dio.post<dynamic>(
      '/events/${_seg(eventId)}/images',
      data: {
        'url': url,
        if (alt.isNotEmpty) 'alt': alt,
        if (caption.isNotEmpty) 'caption': caption,
      },
    );
    return EventDto.fromJson(_map(response.data));
  });

  /// Uploads a visitor's own photo to an event's gallery.
  ///
  /// The bytes go up as the raw request body with their own content
  /// type, which is what `HttpTransport.upload` does. The server takes
  /// JPEG, PNG, GIF and WebP up to 5 MB and checks the bytes, not the
  /// name, so compressing before this call is not optional on a phone.
  Future<EventDto> uploadEventPhoto(
    String eventId, {
    required Uint8List bytes,
    required String contentType,
    String caption = '',
  }) => apiCall(() async {
    final response = await _dio.post<dynamic>(
      '/events/${_seg(eventId)}/photos',
      data: Stream.fromIterable([bytes]),
      queryParameters: {if (caption.isNotEmpty) 'caption': caption},
      options: Options(
        headers: {
          Headers.contentTypeHeader: contentType,
          Headers.contentLengthHeader: bytes.length,
        },
        sendTimeout: uploadTimeout,
        receiveTimeout: uploadTimeout,
      ),
    );
    return EventDto.fromJson(_map(response.data));
  });

  static String _seg(String value) => Uri.encodeComponent(value);

  static Map<String, dynamic> _map(Object? data) =>
      data is Map<String, dynamic> ? data : const {};
}

/// The one write API for visitor actions.
final eventActionsRepositoryProvider = Provider<EventActionsRepository>(
  (ref) => EventActionsRepository(ref.watch(dioProvider)),
);
