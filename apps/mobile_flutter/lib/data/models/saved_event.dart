import 'package:event_tree/core/util/format.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'saved_event.freezed.dart';
part 'saved_event.g.dart';

/// An event a student has saved, as it is kept on the phone.
///
/// Not a DTO: this is the app's own record. It holds enough of the event
/// to draw the Saved tab and schedule reminders without a network call,
/// because the point of saving something is that it is there on the bus
/// home with no data left.
@freezed
abstract class SavedEvent with _$SavedEvent {
  /// Creates a saved event.
  const factory({
    @Default('') String id,
    @Default('') String username,
    @Default('') String slug,
    @Default('') String title,
    @Default('') String startsAt,
    @Default('') String endsAt,
    @Default('') String venue,
    @Default('') String category,
    @Default('') String coverUrl,
    @Default('') String savedAt,
  }) = _SavedEvent;

  /// Reads one from storage, tolerating keys an older build never wrote.
  factory fromJson(Map<String, dynamic> json) => _$SavedEventFromJson(json);
}

/// Parsed dates and the wording the Saved tab uses.
extension SavedEventDates on SavedEvent {
  /// When it starts, in the phone's time zone, or null if unreadable.
  DateTime? get startsAtLocal => Format.parse(startsAt);

  /// When it ends, in the phone's time zone, or null if unreadable.
  DateTime? get endsAtLocal => Format.parse(endsAt);

  /// Whether the event has already finished, by the phone's clock.
  ///
  /// The server owns an event's status (plan §1), but a saved event may
  /// be read with no connection, so the Saved tab sorts by the clock and
  /// re-checks with the server when it can.
  bool get isOver {
    final end = endsAtLocal ?? startsAtLocal;
    return end != null && DateTime.now().isAfter(end);
  }

  /// "Thu 4 Dec · Main Hall".
  String get subtitle {
    final start = startsAtLocal;
    final where = venue.isNotEmpty ? venue : category;
    if (start == null) return where;
    final when = '${Format.shortDate(start)} · ${Format.time(start)}';
    return where.isEmpty ? when : '$when · $where';
  }
}

/// Turning an event from the API into something worth keeping.
extension EventToSaved on EventDto {
  /// A snapshot of this event for the Saved tab, under [username].
  SavedEvent toSaved(String username) => SavedEvent(
    id: id,
    username: username,
    slug: slug,
    title: title,
    startsAt: startsAt,
    endsAt: endsAt,
    venue: venue,
    category: category,
    coverUrl: coverImage?.url ?? '',
    savedAt: DateTime.now().toUtc().toIso8601String(),
  );
}
