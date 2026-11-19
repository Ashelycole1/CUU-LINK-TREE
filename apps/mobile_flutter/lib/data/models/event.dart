import 'package:event_tree/core/util/format.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'event.freezed.dart';
part 'event.g.dart';

/// Where an event is in time, as decided by the server.
///
/// Mirrors `EventStatus` in `packages/core/src/dto.ts`. The app never
/// works this out from the dates (plan §1); it re-fetches the page
/// instead. Anything unexpected reads as [upcoming].
@JsonEnum(valueField: 'wire')
enum EventStatus {
  /// Has not started yet.
  upcoming('upcoming'),

  /// Started and not finished.
  live('live'),

  /// Finished. Reviews and photos open up here.
  past('past');

  new(this.wire);

  /// The value the API sends.
  final String wire;

  /// The word shown on a badge.
  String get label => switch (this) {
    upcoming => 'Upcoming',
    live => 'Live',
    past => 'Past',
  };
}

/// What an event link leads to.
///
/// Mirrors `EventLinkKind`. Unknown kinds read as [other], so a kind
/// added on the server later cannot break an older app.
@JsonEnum(valueField: 'wire')
enum EventLinkKind {
  /// Sign-up form.
  register('register'),

  /// Paid entry.
  tickets('tickets'),

  /// The running order.
  agenda('agenda'),

  /// Watch it as it happens.
  livestream('livestream'),

  /// Slide decks.
  slides('slides'),

  /// A photo album.
  photos('photos'),

  /// A recording made afterwards.
  recording('recording'),

  /// Anything else.
  other('other');

  new(this.wire);

  /// The value the API sends.
  final String wire;
}

/// A picture with its alt text and caption. Mirrors `ImageLinkDTO`.
@freezed
abstract class ImageLinkDto with _$ImageLinkDto {
  /// Creates an image link.
  const factory({
    @Default('') String url,
    @Default('') String alt,
    @Default('') String caption,
  }) = _ImageLinkDto;

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) => _$ImageLinkDtoFromJson(json);
}

/// A button on an event. Mirrors `EventLinkDTO`.
@freezed
abstract class EventLinkDto with _$EventLinkDto {
  /// Creates an event link.
  const factory({
    @Default('') String label,
    @Default('') String url,
    @JsonKey(unknownEnumValue: EventLinkKind.other)
    @Default(EventLinkKind.other)
    EventLinkKind kind,
    @Default(false) bool primary,
  }) = _EventLinkDto;

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) => _$EventLinkDtoFromJson(json);
}

/// How an event was rated. Mirrors `RatingSummaryDTO`.
@freezed
abstract class RatingSummaryDto with _$RatingSummaryDto {
  /// Creates a rating summary.
  const factory({
    @Default(0) int count,
    @Default(0) double average,
    @Default([0, 0, 0, 0, 0]) List<int> distribution,
  }) = _RatingSummaryDto;

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) =>
      _$RatingSummaryDtoFromJson(json);
}

/// One event, exactly as `EventDTO` defines it.
///
/// Every field has a default, so a record missing a key still renders.
/// Dates stay as the API's ISO strings; use [EventDates] for the parsed
/// values.
@freezed
abstract class EventDto with _$EventDto {
  /// Creates an event.
  const factory({
    @Default('') String id,
    @Default('') String ownerId,
    @Default('') String slug,
    @Default('') String title,
    @Default('') String description,
    @Default('') String category,
    @Default('') String organizer,
    @Default('') String venue,
    @Default('') String emoji,
    @Default('') String startsAt,
    @Default('') String endsAt,
    ImageLinkDto? coverImage,
    @Default([]) List<ImageLinkDto> gallery,
    @Default([]) List<EventLinkDto> links,
    @Default(0) int position,
    @Default(false) bool hidden,
    @Default('') String createdAt,
    @Default('') String updatedAt,
    @JsonKey(unknownEnumValue: EventStatus.upcoming)
    @Default(EventStatus.upcoming)
    EventStatus status,
    @Default(false) bool acceptsReviews,
    @Default(RatingSummaryDto()) RatingSummaryDto rating,
  }) = _EventDto;

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) => _$EventDtoFromJson(json);
}

/// Parsed dates and the wording that goes with them.
extension EventDates on EventDto {
  /// When it starts, in the phone's time zone, or null if unreadable.
  DateTime? get startsAtLocal => Format.parse(startsAt);

  /// When it ends, in the phone's time zone, or null if unreadable.
  DateTime? get endsAtLocal => Format.parse(endsAt);

  /// "Thu 4 Dec · 2:00 PM – 5:00 PM", or an empty string when the dates
  /// cannot be read.
  String get whenText {
    final start = startsAtLocal;
    final end = endsAtLocal;
    if (start == null) return '';
    if (end == null) {
      return '${Format.shortDate(start)} · '
          '${Format.time(start)}';
    }
    return Format.dateRange(start, end);
  }

  /// The short line under a title in a list: "Thu 4 Dec · Main Hall".
  String get listSubtitle {
    final start = startsAtLocal;
    final where = venue.isNotEmpty ? venue : category;
    if (status == EventStatus.live) {
      return where.isEmpty ? 'Happening now' : 'Now · $where';
    }
    if (start == null) return where;
    final when = Format.shortDate(start);
    return where.isEmpty ? when : '$when · $where';
  }

  /// The links with the primary ones first, as the web page orders them.
  List<EventLinkDto> get sortedLinks {
    final sorted = [...links]
      ..sort((a, b) {
        if (a.primary == b.primary) return 0;
        return a.primary ? -1 : 1;
      });
    return sorted;
  }
}

/// Which events to list. Mirrors `EventListQuery`.
@immutable
class EventListQuery {
  /// Creates a list query. Empty values are left out of the request.
  const new({this.when = '', this.category = '', this.q = '', this.limit});

  /// Only the events still to come, including any happening now.
  static const EventListQuery upcoming = EventListQuery(when: 'upcoming');

  /// Only the events that have finished.
  static const EventListQuery past = EventListQuery(when: 'past');

  /// `upcoming`, `past`, `all`, or empty for the server's default.
  final String when;

  /// One of the fixed category names, or empty for all.
  final String category;

  /// Free text to search with.
  final String q;

  /// How many events to return at most.
  final int? limit;

  /// The query string the API expects, with empty values dropped.
  Map<String, dynamic> toQueryParameters() => {
    if (when.isNotEmpty) 'when': when,
    if (category.isNotEmpty) 'category': category,
    if (q.isNotEmpty) 'q': q,
    if (limit != null) 'limit': limit,
  };

  @override
  bool operator ==(Object other) =>
      other is EventListQuery &&
      other.when == when &&
      other.category == category &&
      other.q == q &&
      other.limit == limit;

  @override
  int get hashCode => Object.hash(when, category, q, limit);
}
