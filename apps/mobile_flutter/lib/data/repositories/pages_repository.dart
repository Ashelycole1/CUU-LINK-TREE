import 'package:dio/dio.dart';
import 'package:event_tree/core/network/dio_provider.dart';
import 'package:event_tree/data/models/community.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:event_tree/data/models/theme_preset.dart';
import 'package:event_tree/data/models/tree.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Everything a visitor can read without signing in.
///
/// One method per endpoint in `packages/api-client/src/EventTreeClient.ts`,
/// with the same names, so the two clients stay easy to compare. Every
/// call throws an `ApiError` and nothing else.
class PagesRepository {
  /// Reads through [_dio], which is already pointed at `/api/v1`.
  const new(this._dio);

  final Dio _dio;

  /// The themes a host can choose from.
  Future<List<ThemePresetDto>> getThemes() => apiCall(() async {
    final response = await _dio.get<dynamic>('/themes');
    return _list(response.data, ThemePresetDto.fromJson);
  });

  /// Upcoming events from every host, for the Discover tab.
  Future<CommunityDto> getCommunity([
    CommunityQuery query = const CommunityQuery(),
  ]) => apiCall(() async {
    final response = await _dio.get<dynamic>(
      '/community',
      queryParameters: query.toQueryParameters(),
    );
    return CommunityDto.fromJson(_map(response.data));
  });

  /// A host's whole public page: profile, upcoming and past.
  Future<TreeDto> getPage(String username) => apiCall(() async {
    final response = await _dio.get<dynamic>('/pages/${_seg(username)}');
    return TreeDto.fromJson(_map(response.data));
  });

  /// Part of a host's page, filtered.
  Future<List<EventDto>> listPageEvents(
    String username, [
    EventListQuery query = const EventListQuery(),
  ]) => apiCall(() async {
    final response = await _dio.get<dynamic>(
      '/pages/${_seg(username)}/events',
      queryParameters: query.toQueryParameters(),
    );
    return _list(response.data, EventDto.fromJson);
  });

  /// One event on a host's page.
  Future<EventDto> getPageEvent(String username, String slug) =>
      apiCall(() async {
        final response = await _dio.get<dynamic>(
          '/pages/${_seg(username)}/events/${_seg(slug)}',
        );
        return EventDto.fromJson(_map(response.data));
      });

  /// Counts one visit to a host's page, for the host's own analytics.
  ///
  /// This is the in-house counter hosts see in their dashboard, not
  /// PostHog (plan §6). It is best-effort: a failure here must never
  /// stop the page from showing.
  Future<void> recordView(String username) => apiCall(() async {
    await _dio.post<dynamic>(
      '/pages/${_seg(username)}/views',
      data: const <String, dynamic>{},
    );
  });

  static String _seg(String value) => Uri.encodeComponent(value);

  static Map<String, dynamic> _map(Object? data) =>
      data is Map<String, dynamic> ? data : const {};

  static List<T> _list<T>(Object? data, T Function(Map<String, dynamic>) read) {
    if (data is! List) return const [];
    return [
      for (final item in data)
        if (item is Map<String, dynamic>) read(item),
    ];
  }
}

/// The one read-only API for public pages.
final pagesRepositoryProvider = Provider<PagesRepository>(
  (ref) => PagesRepository(ref.watch(dioProvider)),
);
