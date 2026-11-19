import 'package:event_tree/data/models/event.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'community.freezed.dart';
part 'community.g.dart';

/// The host an event belongs to, as the Discover feed carries it.
///
/// Mirrors the inline `host` object on `CommunityEventDTO`. `color` is
/// the host's accent, used for the ring around their avatar.
@freezed
abstract class CommunityHostDto with _$CommunityHostDto {
  /// Creates a host summary.
  const factory({
    @Default('') String username,
    @Default('') String displayName,
    @Default('') String avatarUrl,
    @Default('') String color,
  }) = _CommunityHostDto;

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) =>
      _$CommunityHostDtoFromJson(json);
}

/// One upcoming event in the Discover feed. Mirrors
/// `CommunityEventDTO`.
@freezed
abstract class CommunityEventDto with _$CommunityEventDto {
  /// Creates a feed entry.
  const factory({
    @Default(EventDto()) EventDto event,
    @Default(CommunityHostDto()) CommunityHostDto host,
  }) = _CommunityEventDto;

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) =>
      _$CommunityEventDtoFromJson(json);
}

/// One registered page in the directory. Mirrors `CommunityPageDTO`.
@freezed
abstract class CommunityPageDto with _$CommunityPageDto {
  /// Creates a directory entry.
  const factory({
    @Default('') String username,
    @Default('') String displayName,
    @Default('') String avatarUrl,
    @Default('') String color,
    @Default(0) int upcoming,
    @Default(0) int past,
  }) = _CommunityPageDto;

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) =>
      _$CommunityPageDtoFromJson(json);
}

/// How many events a category holds right now. Mirrors the inline
/// `categories` entry on `CommunityDTO`.
@freezed
abstract class CategoryCountDto with _$CategoryCountDto {
  /// Creates a category count.
  const factory({@Default('') String name, @Default(0) int count}) =
      _CategoryCountDto;

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) =>
      _$CategoryCountDtoFromJson(json);
}

/// Site-wide totals. Mirrors the inline `totals` on `CommunityDTO`.
@freezed
abstract class CommunityTotalsDto with _$CommunityTotalsDto {
  /// Creates the totals.
  const factory({@Default(0) int events, @Default(0) int pages}) =
      _CommunityTotalsDto;

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) =>
      _$CommunityTotalsDtoFromJson(json);
}

/// Everything the Discover tab needs, in one call. Mirrors
/// `CommunityDTO`.
@freezed
abstract class CommunityDto with _$CommunityDto {
  /// Creates a feed.
  const factory({
    @Default([]) List<CommunityEventDto> events,
    @Default([]) List<CategoryCountDto> categories,
    @Default([]) List<CommunityPageDto> pages,
    @Default(CommunityTotalsDto()) CommunityTotalsDto totals,
  }) = _CommunityDto;

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) => _$CommunityDtoFromJson(json);
}

/// What the Discover tab is asking for. Mirrors `CommunityQuery`.
@immutable
class CommunityQuery {
  /// Creates a query. Empty values are left out of the request.
  const new({this.category = '', this.q = '', this.limit});

  /// One of `packages/core/src/events/categories.ts`, or empty for all.
  final String category;

  /// Free text to search titles and descriptions with.
  final String q;

  /// How many events to return at most.
  final int? limit;

  /// Whether this is the plain, unfiltered feed.
  bool get isEmpty => category.isEmpty && q.isEmpty;

  /// A copy with some values replaced.
  CommunityQuery copyWith({String? category, String? q, int? limit}) =>
      CommunityQuery(
        category: category ?? this.category,
        q: q ?? this.q,
        limit: limit ?? this.limit,
      );

  /// The query string the API expects, with empty values dropped.
  Map<String, dynamic> toQueryParameters() => {
    if (category.isNotEmpty) 'category': category,
    if (q.isNotEmpty) 'q': q,
    if (limit != null) 'limit': limit,
  };

  @override
  bool operator ==(Object other) =>
      other is CommunityQuery &&
      other.category == category &&
      other.q == q &&
      other.limit == limit;

  @override
  int get hashCode => Object.hash(category, q, limit);
}
