import 'package:freezed_annotation/freezed_annotation.dart';

part 'profile.freezed.dart';
part 'profile.g.dart';

/// The social networks a host can link to. Mirrors `SocialPlatform`.
@JsonEnum(valueField: 'wire')
enum SocialPlatform {
  /// Instagram.
  instagram('instagram'),

  /// X, formerly Twitter.
  x('x'),

  /// LinkedIn.
  linkedin('linkedin'),

  /// WhatsApp.
  whatsapp('whatsapp'),

  /// YouTube.
  youtube('youtube'),

  /// TikTok.
  tiktok('tiktok'),

  /// Facebook.
  facebook('facebook'),

  /// Anything else the host links to.
  website('website');

  new(this.wire);

  /// The value the API sends.
  final String wire;
}

/// How a host's event buttons are drawn. Mirrors `ButtonStyle` in
/// `dto.ts`; `ticket` is the house style with the notched date stub.
@JsonEnum(valueField: 'wire')
enum PageButtonStyle {
  /// A notched stub carrying the date.
  ticket('ticket'),

  /// Fully rounded.
  pill('pill'),

  /// Transparent with a two-pixel border.
  outline('outline'),

  /// A hard offset shadow.
  shadow('shadow');

  new(this.wire);

  /// The value the API sends.
  final String wire;
}

/// The three fonts a host can choose. Mirrors `FontChoice`.
@JsonEnum(valueField: 'wire')
enum PageFont {
  /// Bricolage Grotesque, the display face.
  bricolage('bricolage'),

  /// Figtree, the app's own face.
  figtree('figtree'),

  /// Fraunces, the serif.
  fraunces('fraunces');

  new(this.wire);

  /// The value the API sends.
  final String wire;

  /// The family name declared in `pubspec.yaml`.
  String get family => switch (this) {
    bricolage => 'Bricolage Grotesque',
    figtree => 'Figtree',
    fraunces => 'Fraunces',
  };
}

/// One social link on a host's page. Mirrors `SocialLinkDTO`.
@freezed
abstract class SocialLinkDto with _$SocialLinkDto {
  /// Creates a social link.
  const factory({
    @JsonKey(unknownEnumValue: SocialPlatform.website)
    @Default(SocialPlatform.website)
    SocialPlatform platform,
    @Default('') String url,
  }) = _SocialLinkDto;

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) => _$SocialLinkDtoFromJson(json);
}

/// The five colours a host's page is painted with. Mirrors
/// `ThemeColors`; the defaults are the app's own dark palette, so a page
/// that arrives without colours is still readable.
@freezed
abstract class ThemeColorsDto with _$ThemeColorsDto {
  /// Creates a colour set.
  const factory({
    @Default('#121212') String background,
    @Default('#FFFFFF') String text,
    @Default('#181818') String card,
    @Default('#FFFFFF') String cardText,
    @Default('#FFC72C') String accent,
  }) = _ThemeColorsDto;

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) => _$ThemeColorsDtoFromJson(json);
}

/// How a host's page looks. Mirrors `AppearanceDTO`.
@freezed
abstract class AppearanceDto with _$AppearanceDto {
  /// Creates an appearance.
  const factory({
    @Default('') String themeId,
    @Default(ThemeColorsDto()) ThemeColorsDto colors,
    @JsonKey(unknownEnumValue: PageButtonStyle.ticket)
    @Default(PageButtonStyle.ticket)
    PageButtonStyle buttonStyle,
    @JsonKey(unknownEnumValue: PageFont.figtree)
    @Default(PageFont.figtree)
    PageFont font,
  }) = _AppearanceDto;

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) => _$AppearanceDtoFromJson(json);
}

/// A host's public page settings. Mirrors `ProfileDTO`.
@freezed
abstract class ProfileDto with _$ProfileDto {
  /// Creates a profile.
  const factory({
    @Default('') String ownerId,
    @Default('') String username,
    @Default('') String displayName,
    @Default('') String bio,
    @Default('') String avatarUrl,
    @Default('') String heroImageUrl,
    @Default([]) List<SocialLinkDto> socials,
    @Default(AppearanceDto()) AppearanceDto appearance,
  }) = _ProfileDto;

  /// Reads one from JSON, tolerating missing keys.
  factory fromJson(Map<String, dynamic> json) => _$ProfileDtoFromJson(json);
}
