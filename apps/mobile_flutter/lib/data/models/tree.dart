import 'package:event_tree/data/models/event.dart';
import 'package:event_tree/data/models/profile.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'tree.freezed.dart';
part 'tree.g.dart';

/// Everything a host's public page needs, in one call.
///
/// Mirrors `TreeDTO`: the profile, the upcoming events (which includes
/// anything happening right now), the past ones, and the categories the
/// host has used.
@freezed
abstract class TreeDto with _$TreeDto {
  /// Creates a page.
  const factory({
    @Default(ProfileDto()) ProfileDto profile,
    @Default([]) List<EventDto> upcoming,
    @Default([]) List<EventDto> past,
    @Default([]) List<String> categories,
  }) = _TreeDto;

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) => _$TreeDtoFromJson(json);
}
