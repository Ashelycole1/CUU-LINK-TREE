import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:event_tree/core/network/dio_provider.dart';
import 'package:event_tree/data/models/analytics_summary.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:event_tree/data/models/profile.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Everything behind `/me`: a host's own events, page and numbers.
///
/// Every call needs the Neon Auth JWT, which the Dio interceptor adds.
/// The server checks ownership on every write, so nothing here has to.
/// One method per endpoint in `EventTreeClient.ts`, same names.
class DashboardRepository {
  /// Reads and writes through [_dio], which signs requests.
  const new(this._dio);

  final Dio _dio;

  /// The host's own page settings.
  Future<ProfileDto> getMyProfile() => apiCall(() async {
    final response = await _dio.get<dynamic>('/me/profile');
    return ProfileDto.fromJson(_map(response.data));
  });

  /// Changes some of the page settings. Only the keys given are sent.
  Future<ProfileDto> updateMyProfile(Map<String, dynamic> patch) =>
      apiCall(() async {
        final response = await _dio.patch<dynamic>('/me/profile', data: patch);
        return ProfileDto.fromJson(_map(response.data));
      });

  /// Every event the host owns, hidden ones included.
  Future<List<EventDto>> listMyEvents() => apiCall(() async {
    final response = await _dio.get<dynamic>('/me/events');
    return _events(response.data);
  });

  /// Posts a new event.
  Future<EventDto> createEvent(Map<String, dynamic> input) => apiCall(() async {
    final response = await _dio.post<dynamic>('/me/events', data: input);
    return EventDto.fromJson(_map(response.data));
  });

  /// Changes an event. Only the keys given are sent.
  Future<EventDto> updateEvent(String eventId, Map<String, dynamic> patch) =>
      apiCall(() async {
        final response = await _dio.patch<dynamic>(
          '/me/events/${_seg(eventId)}',
          data: patch,
        );
        return EventDto.fromJson(_map(response.data));
      });

  /// Deletes an event for good.
  Future<void> deleteEvent(String eventId) => apiCall(() async {
    await _dio.delete<dynamic>('/me/events/${_seg(eventId)}');
  });

  /// Sets the order events appear in on the public page.
  Future<List<EventDto>> reorderEvents(List<String> ids) => apiCall(() async {
    final response = await _dio.put<dynamic>(
      '/me/events/order',
      data: {'ids': ids},
    );
    return _events(response.data);
  });

  /// Views and clicks over the last [days] days.
  Future<AnalyticsSummaryDto> getAnalytics({int days = 14}) =>
      apiCall(() async {
        final response = await _dio.get<dynamic>(
          '/me/analytics',
          queryParameters: {'days': days},
        );
        return AnalyticsSummaryDto.fromJson(_map(response.data));
      });

  /// Stores an avatar, header image or poster and returns its address.
  ///
  /// The bytes go up as the raw body with their own content type, the
  /// way `HttpTransport.upload` sends them.
  Future<String> uploadImage({
    required Uint8List bytes,
    required String contentType,
  }) => apiCall(() async {
    final response = await _dio.post<dynamic>(
      '/me/uploads',
      data: Stream.fromIterable([bytes]),
      options: Options(
        headers: {
          Headers.contentTypeHeader: contentType,
          Headers.contentLengthHeader: bytes.length,
        },
        sendTimeout: uploadTimeout,
        receiveTimeout: uploadTimeout,
      ),
    );
    final url = _map(response.data)['url'];
    return url is String ? url : '';
  });

  static String _seg(String value) => Uri.encodeComponent(value);

  static Map<String, dynamic> _map(Object? data) =>
      data is Map<String, dynamic> ? data : const {};

  static List<EventDto> _events(Object? data) {
    if (data is! List) return const [];
    return [
      for (final item in data)
        if (item is Map<String, dynamic>) EventDto.fromJson(item),
    ];
  }
}

/// The one dashboard API.
final dashboardRepositoryProvider = Provider<DashboardRepository>(
  (ref) => DashboardRepository(ref.watch(dioProvider)),
);
