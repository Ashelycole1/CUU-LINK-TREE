import 'package:event_tree/data/models/profile.dart';
import 'package:freezed_annotation/freezed_annotation.dart';

part 'theme_preset.freezed.dart';
part 'theme_preset.g.dart';

/// One of the themes a host can pick from. Mirrors `ThemePreset`.
@freezed
abstract class ThemePresetDto with _$ThemePresetDto {
  /// Creates a theme preset.
  const factory({
    @Default('') String id,
    @Default('') String name,
    @Default(ThemeColorsDto()) ThemeColorsDto colors,
    @JsonKey(unknownEnumValue: PageButtonStyle.ticket)
    @Default(PageButtonStyle.ticket)
    PageButtonStyle buttonStyle,
    @JsonKey(unknownEnumValue: PageFont.figtree)
    @Default(PageFont.figtree)
    PageFont font,
  }) = _ThemePresetDto;

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) => _$ThemePresetDtoFromJson(json);
}
