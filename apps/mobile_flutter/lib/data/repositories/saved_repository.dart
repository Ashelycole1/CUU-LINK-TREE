import 'dart:convert';

import 'package:event_tree/data/models/saved_event.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// What the phone remembers on its own: saved events, followed hosts,
/// and which of a host's events have already been seen.
///
/// Nothing here touches the server. Everything is small, so
/// `shared_preferences` is enough and no database is needed (plan §2).
/// Every read tolerates rubbish in storage and falls back to empty
/// rather than throwing, because a bad value must never stop the app
/// from starting (plan §7, rule 2).
class SavedRepository {
  /// Reads and writes through [_prefs].
  const new(this._prefs);

  /// Opens the store. Cheap after the first call.
  static Future<SavedRepository> open() async =>
      SavedRepository(await SharedPreferences.getInstance());

  static const String _eventsKey = 'saved_events_v1';
  static const String _followingKey = 'following_v1';
  static const String _seenPrefix = 'seen_events_v1:';

  final SharedPreferences _prefs;

  /// Every saved event, soonest first.
  List<SavedEvent> savedEvents() {
    final events = _readEvents().values.toList()
      ..sort((a, b) => a.startsAt.compareTo(b.startsAt));
    return events;
  }

  /// Whether [eventId] is saved.
  bool isSaved(String eventId) => _readEvents().containsKey(eventId);

  /// Saves [event], replacing any older copy of it.
  Future<void> save(SavedEvent event) async {
    if (event.id.isEmpty) return;
    final events = _readEvents()..[event.id] = event;
    await _writeEvents(events);
  }

  /// Forgets the event with [eventId].
  Future<void> remove(String eventId) async {
    final events = _readEvents();
    if (events.remove(eventId) == null) return;
    await _writeEvents(events);
  }

  /// The hosts being followed, in the order they were followed.
  List<String> following() => _prefs.getStringList(_followingKey) ?? const [];

  /// Whether [username] is followed.
  bool isFollowing(String username) => following().contains(username);

  /// Follows [username], or does nothing if it is already followed.
  Future<void> follow(String username) async {
    if (username.isEmpty || isFollowing(username)) return;
    await _prefs.setStringList(_followingKey, [...following(), username]);
  }

  /// Unfollows [username] and forgets which of their events were seen.
  Future<void> unfollow(String username) async {
    await _prefs.setStringList(
      _followingKey,
      following().where((name) => name != username).toList(),
    );
    await _prefs.remove('$_seenPrefix$username');
  }

  /// The event IDs already seen for [username].
  ///
  /// Background sync compares a fresh list against this to decide what
  /// counts as new (plan §5.2).
  Set<String> seenEvents(String username) =>
      (_prefs.getStringList('$_seenPrefix$username') ?? const []).toSet();

  /// Records the event IDs now known for [username].
  Future<void> rememberSeen(String username, Set<String> ids) =>
      _prefs.setStringList('$_seenPrefix$username', ids.toList());

  Map<String, SavedEvent> _readEvents() {
    final raw = _prefs.getString(_eventsKey);
    if (raw == null || raw.isEmpty) return {};
    try {
      final decoded = jsonDecode(raw);
      if (decoded is! List) return {};
      final events = <String, SavedEvent>{};
      for (final item in decoded) {
        if (item is! Map<String, dynamic>) continue;
        final event = SavedEvent.fromJson(item);
        if (event.id.isNotEmpty) events[event.id] = event;
      }
      return events;
    } on FormatException {
      return {};
    }
  }

  Future<void> _writeEvents(Map<String, SavedEvent> events) => _prefs.setString(
    _eventsKey,
    jsonEncode([for (final event in events.values) event.toJson()]),
  );
}

/// The phone's own store, opened once.
///
/// It is a `FutureProvider` because `SharedPreferences` has to be read
/// from disk; screens go through `savedEventsProvider` and friends
/// rather than waiting on this directly.
final savedRepositoryProvider = FutureProvider<SavedRepository>(
  (ref) => SavedRepository.open(),
);
