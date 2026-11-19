import 'package:event_tree/data/models/profile.dart';
import 'package:flutter/widgets.dart';

/// A host's own look, turned into values widgets can use.
///
/// This is the only place in the app where a host's colours appear
/// (plan §4): the tabs, Discover, Saved and Settings always stay in the
/// dark app theme. It is the Dart side of `apps/web/src/styles/tree.css`,
/// which reads the same five `--t-*` variables.
@immutable
class PageTheme {
  /// Creates a page theme from colours that have already been parsed.
  const new({
    required this.background,
    required this.text,
    required this.card,
    required this.cardText,
    required this.accent,
    required this.buttonStyle,
    required this.fontFamily,
  });

  /// Builds a page theme from an [AppearanceDto].
  factory fromAppearance(AppearanceDto appearance) {
    final colors = appearance.colors;
    return PageTheme(
      background: parseHexColor(colors.background, const Color(0xFF121212)),
      text: parseHexColor(colors.text, const Color(0xFFFFFFFF)),
      card: parseHexColor(colors.card, const Color(0xFF181818)),
      cardText: parseHexColor(colors.cardText, const Color(0xFFFFFFFF)),
      accent: parseHexColor(colors.accent, const Color(0xFFFFC72C)),
      buttonStyle: appearance.buttonStyle,
      fontFamily: appearance.font.family,
    );
  }

  /// The page behind everything.
  final Color background;

  /// Headings and body copy on [background].
  final Color text;

  /// Event buttons and the avatar well.
  final Color card;

  /// Text on [card].
  final Color cardText;

  /// The host's highlight: the live dot and the perforation.
  final Color accent;

  /// Which shape the event buttons take.
  final PageButtonStyle buttonStyle;

  /// The bundled font family for this page.
  final String fontFamily;

  /// Secondary text on the page background, as the web's `--t-muted`.
  Color get muted => text.withValues(alpha: 0.84);

  /// The web's `--glass`: a wash of the text colour, for icon wells.
  Color get glass => text.withValues(alpha: 0.11);

  /// The web's `--glass-strong`, for a pressed icon well.
  Color get glassStrong => text.withValues(alpha: 0.2);

  /// A wash of the card's text colour, for a thumbnail with no image.
  Color get cardWell => cardText.withValues(alpha: 0.09);

  /// Text that stays readable on [accent], whatever the host chose.
  Color get onAccent => accent.computeLuminance() > 0.5
      ? const Color(0xFF121212)
      : const Color(0xFFFFFFFF);

  /// The dashed perforation between a ticket and its stub.
  Color get perforation => cardText.withValues(alpha: 0.28);

  @override
  bool operator ==(Object other) =>
      other is PageTheme &&
      other.background == background &&
      other.text == text &&
      other.card == card &&
      other.cardText == cardText &&
      other.accent == accent &&
      other.buttonStyle == buttonStyle &&
      other.fontFamily == fontFamily;

  @override
  int get hashCode => Object.hash(
    background,
    text,
    card,
    cardText,
    accent,
    buttonStyle,
    fontFamily,
  );

  /// A text style on the page background in the host's font.
  TextStyle textStyle({
    required double size,
    FontWeight weight = FontWeight.w400,
    Color? color,
    double height = 1.3,
    double letterSpacing = 0,
  }) => TextStyle(
    fontFamily: fontFamily,
    fontSize: size,
    height: height,
    fontWeight: weight,
    letterSpacing: letterSpacing,
    color: color ?? text,
  );
}

/// Reads `#RGB`, `#RRGGBB` or `#RRGGBBAA`, falling back to [fallback].
///
/// Hosts type these into the appearance editor, so anything can arrive;
/// a bad value must never leave a screen unpainted (plan §7, rule 2).
Color parseHexColor(String value, Color fallback) {
  var hex = value.trim().replaceFirst('#', '');
  if (hex.length == 3) hex = hex.split('').map((c) => '$c$c').join();
  if (hex.length == 6) hex = '${hex}FF';
  if (hex.length != 8) return fallback;
  // The API writes #RRGGBBAA; Flutter's Color wants 0xAARRGGBB.
  final parsed = int.tryParse(
    '${hex.substring(6, 8)}${hex.substring(0, 6)}',
    radix: 16,
  );
  return parsed == null ? fallback : Color(parsed);
}

/// Hands the host's [PageTheme] to everything below it.
class PageThemeScope extends InheritedWidget {
  /// Wraps [child] in [theme].
  const new({required this.theme, required super.child, super.key});

  /// The host's look.
  final PageTheme theme;

  /// The nearest host theme, or null outside a host's page.
  static PageTheme? maybeOf(BuildContext context) =>
      context.dependOnInheritedWidgetOfExactType<PageThemeScope>()?.theme;

  /// The nearest host theme. Only call this inside a host's page.
  static PageTheme of(BuildContext context) {
    final theme = maybeOf(context);
    assert(theme != null, 'No PageThemeScope above this widget.');
    return theme ?? PageTheme.fromAppearance(const AppearanceDto());
  }

  @override
  bool updateShouldNotify(PageThemeScope oldWidget) => oldWidget.theme != theme;
}
