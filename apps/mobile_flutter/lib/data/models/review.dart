import 'package:event_tree/core/util/format.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'review.freezed.dart';
part 'review.g.dart';

/// One visitor's rating and words about an event. Mirrors `ReviewDTO`.
///
/// Reviews are read in phase 2 and written in phase 5.
@freezed
abstract class ReviewDto with _$ReviewDto {
  /// Creates a review.
  const factory({
    @Default('') String id,
    @Default('') String eventId,
    @Default('') String authorName,
    @Default(0) int rating,
    @Default('') String comment,
    @Default('') String createdAt,
  }) = _ReviewDto;

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) => _$ReviewDtoFromJson(json);
}

/// When the review was written.
extension ReviewDates on ReviewDto {
  /// "Thu 4 Dec", or an empty string when the date cannot be read.
  String get writtenOn {
    final at = Format.parse(createdAt);
    return at == null ? '' : Format.shortDate(at);
  }
}
