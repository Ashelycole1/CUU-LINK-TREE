import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:event_tree/core/auth/session_store.dart';
import 'package:event_tree/core/network/dio_provider.dart';
import 'package:event_tree/core/notifications/local_notification_service.dart';
import 'package:event_tree/core/notifications/notification_service.dart';
import 'package:event_tree/data/models/saved_event.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// A Dio adapter that answers from a map instead of the network.
///
/// Tests get the real repositories, the real JSON reading and the real
/// error mapping; only the socket is replaced.
class FakeApiAdapter implements HttpClientAdapter {
  /// Answers every request with [reply].
  const new(this.reply);

  /// Builds the answer for one request.
  final ResponseBody Function(RequestOptions options) reply;

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async => reply(options);

  @override
  void close({bool force = false}) {}
}

const Map<String, List<String>> _jsonHeaders = {
  Headers.contentTypeHeader: ['application/json; charset=utf-8'],
};

/// The origin tests pretend the server is on.
const String testOrigin = 'https://test.eventtree.app';

/// A Dio that serves [routes] by path and 404s anything else.
///
/// Keys are the paths the repositories ask for, such as `/community` or
/// `/pages/gdg`. Pass [recorded] to collect what was asked for.
Dio fakeApiDio(Map<String, Object?> routes, {List<RequestOptions>? recorded}) {
  return buildApiDio(origin: testOrigin)
    ..httpClientAdapter = FakeApiAdapter((options) {
      recorded?.add(options);
      if (!routes.containsKey(options.path)) {
        return ResponseBody.fromString(
          jsonEncode({
            'error': {'code': 'NOT_FOUND', 'message': 'Not found.'},
          }),
          404,
          headers: _jsonHeaders,
        );
      }
      return ResponseBody.fromString(
        jsonEncode(routes[options.path]),
        200,
        headers: _jsonHeaders,
      );
    });
}

/// A Dio where every request fails as if the phone were offline.
Dio offlineApiDio() =>
    buildApiDio(origin: testOrigin)
      ..httpClientAdapter = FakeApiAdapter((options) {
        throw DioException.connectionError(
          requestOptions: options,
          reason: 'offline',
        );
      });

/// Wraps [child] in a scope pointed at [dio] instead of a real server.
///
/// Hands back the scope rather than a list of overrides because
/// flutter_riverpod 3 does not export the `Override` type. Pass
/// [notifications] to watch what a screen would have scheduled.
Widget withFakeApi(
  Dio dio, {
  required Widget child,
  NotificationService? notifications,
}) => ProviderScope(
  overrides: [
    dioProvider.overrideWithValue(dio),
    // There is no keystore in a test VM, and a screen waiting on one
    // never settles.
    sessionStoreProvider.overrideWithValue(MemorySessionStore()),
    if (notifications != null)
      notificationServiceProvider.overrideWithValue(notifications),
  ],
  child: child,
);

/// A [NotificationService] that records instead of notifying.
class FakeNotifications implements NotificationService {
  /// Creates a recorder that grants permission when [granted] is true.
  new({this.granted = true});

  /// What [requestPermission] answers.
  final bool granted;

  /// The events reminders were scheduled for, in order.
  final List<SavedEvent> scheduled = [];

  /// The event ids reminders were cancelled for.
  final List<String> cancelled = [];

  /// The notifications shown straight away.
  final List<String> shown = [];

  /// How many times permission was asked for.
  int permissionRequests = 0;

  @override
  Future<void> initialize() async {}

  @override
  Future<bool> requestPermission() async {
    permissionRequests++;
    return granted;
  }

  @override
  Future<bool> hasPermission() async => granted;

  @override
  Future<void> scheduleReminders(SavedEvent event) async =>
      scheduled.add(event);

  @override
  Future<void> cancelReminders(String eventId) async => cancelled.add(eventId);

  @override
  Future<void> showNow({
    required int id,
    required String title,
    required String body,
    String? payload,
  }) async => shown.add(title);

  @override
  Future<void> cancelAll() async {}
}

/// One event as the API sends it, with everything filled in.
Map<String, Object?> eventJson({
  String id = 'evt_1',
  String slug = 'devfest-2026',
  String title = 'DevFest Kampala 2026',
  String category = 'Tech',
  String venue = 'Main Hall',
  String status = 'upcoming',
  String startsAt = '2099-12-04T11:00:00.000Z',
  String endsAt = '2099-12-04T15:00:00.000Z',
  List<Map<String, Object?>> links = const [],
  Map<String, Object?>? rating,
}) => {
  'id': id,
  'ownerId': 'usr_1',
  'slug': slug,
  'title': title,
  'description': 'A day of talks, code labs and community.',
  'category': category,
  'organizer': 'GDG Kampala',
  'venue': venue,
  'emoji': '🎉',
  'startsAt': startsAt,
  'endsAt': endsAt,
  'coverImage': null,
  'gallery': <Object?>[],
  'links': links,
  'position': 0,
  'hidden': false,
  'createdAt': '2026-01-01T00:00:00.000Z',
  'updatedAt': '2026-01-01T00:00:00.000Z',
  'status': status,
  'acceptsReviews': status != 'upcoming',
  'rating':
      rating ??
      {
        'count': 0,
        'average': 0,
        'distribution': [0, 0, 0, 0, 0],
      },
};

/// A host's profile as the API sends it.
Map<String, Object?> profileJson({
  String username = 'gdg',
  String displayName = 'GDG Kampala',
  String buttonStyle = 'ticket',
  List<Map<String, Object?>> socials = const [],
}) => {
  'ownerId': 'usr_1',
  'username': username,
  'displayName': displayName,
  'bio': 'Tech talks, DevFest and code labs.',
  'avatarUrl': '',
  'heroImageUrl': '',
  'socials': socials,
  'appearance': {
    'themeId': 'midnight',
    'colors': {
      'background': '#101014',
      'text': '#FFFFFF',
      'card': '#1C1C24',
      'cardText': '#FFFFFF',
      'accent': '#FFC72C',
    },
    'buttonStyle': buttonStyle,
    'font': 'figtree',
  },
};

/// A whole public page as the API sends it.
Map<String, Object?> treeJson({
  Map<String, Object?>? profile,
  List<Map<String, Object?>> upcoming = const [],
  List<Map<String, Object?>> past = const [],
}) => {
  'profile': profile ?? profileJson(),
  'upcoming': upcoming,
  'past': past,
  'categories': ['Tech'],
};

/// The Discover feed as the API sends it.
Map<String, Object?> communityJson({
  List<Map<String, Object?>> events = const [],
  List<Map<String, Object?>> categories = const [],
  List<Map<String, Object?>> pages = const [],
}) => {
  'events': events,
  'categories': categories,
  'pages': pages,
  'totals': {'events': events.length, 'pages': pages.length},
};

/// One entry in the Discover feed: an event and the host behind it.
Map<String, Object?> communityEventJson({
  Map<String, Object?>? event,
  String username = 'gdg',
}) => {
  'event': event ?? eventJson(),
  'host': {
    'username': username,
    'displayName': 'GDG Kampala',
    'avatarUrl': '',
    'color': '#FFC72C',
  },
};
