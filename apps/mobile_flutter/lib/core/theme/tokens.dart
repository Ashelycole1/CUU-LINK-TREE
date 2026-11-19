import 'package:flutter/widgets.dart';

/// Colours for the app's own screens (Discover, Saved, Dashboard, Profile).
///
/// Mirrors `apps/web/src/styles/tokens.css` (dark), with the surfaces from
/// plan §4. A host's public page never uses these: it uses the host's own
/// appearance (see `page_theme.dart`).
abstract final class AppColors {
  /// The page background.
  static const Color background = Color(0xFF121212);

  /// Cards, sheets and the navigation bar.
  static const Color surface = Color(0xFF181818);

  /// Raised elements on a surface: inputs, chips, icon wells, pressed rows.
  static const Color surfaceRaised = Color(0xFF282828);

  /// Hairlines between rows and around inputs.
  static const Color border = Color(0xFF2A2A2A);

  /// Borders that must stay visible, such as a focused input.
  static const Color borderStrong = Color(0xFF3D3D3D);

  /// Primary text and active icons.
  static const Color text = Color(0xFFFFFFFF);

  /// Secondary text (9.9:1 on [background]).
  static const Color textMuted = Color(0xFFB3B3B3);

  /// Tertiary text, still AA for small sizes (5.4:1 on [background]).
  static const Color textSubtle = Color(0xFF8A8A8A);

  /// The one accent (Event Tree sunflower). Only for primary actions,
  /// the selected state and the live dot.
  static const Color accent = Color(0xFFFFC72C);

  /// Text and icons placed on [accent].
  static const Color onAccent = Color(0xFF121212);

  /// Confirmations.
  static const Color success = Color(0xFF3DDC84);

  /// Errors and destructive actions.
  static const Color danger = Color(0xFFF15E6C);
}

/// Spacing on a 4 dp grid.
abstract final class AppSpacing {
  /// 4 dp.
  static const double xs = 4;

  /// 8 dp.
  static const double sm = 8;

  /// 12 dp.
  static const double md = 12;

  /// 16 dp: the screen gutter.
  static const double lg = 16;

  /// 24 dp: between sections.
  static const double xl = 24;

  /// 32 dp.
  static const double xxl = 32;

  /// 48 dp: the minimum touch target.
  static const double touch = 48;
}

/// Corner radii (cards stay between 8 and 12 dp, plan §4).
abstract final class AppRadii {
  /// 4 dp: badges.
  static const double xs = 4;

  /// 8 dp: tiles and inputs.
  static const double md = 8;

  /// 12 dp: cards and sheets.
  static const double lg = 12;

  /// Fully rounded: buttons and chips.
  static const double pill = 999;
}

/// The type scale. Figtree everywhere in the app chrome, as on the web.
abstract final class AppType {
  /// The bundled app font (see `pubspec.yaml`).
  static const String fontFamily = 'Figtree';

  /// Screen titles ("Discover").
  static const TextStyle display = TextStyle(
    fontFamily: fontFamily,
    fontSize: 32,
    height: 1.15,
    fontWeight: FontWeight.w800,
    letterSpacing: -0.5,
  );

  /// Section headings ("This week").
  static const TextStyle heading = TextStyle(
    fontFamily: fontFamily,
    fontSize: 22,
    height: 1.2,
    fontWeight: FontWeight.w700,
    letterSpacing: -0.2,
  );

  /// Card and row titles.
  static const TextStyle title = TextStyle(
    fontFamily: fontFamily,
    fontSize: 16,
    height: 1.3,
    fontWeight: FontWeight.w700,
  );

  /// Body copy.
  static const TextStyle body = TextStyle(
    fontFamily: fontFamily,
    fontSize: 15,
    height: 1.45,
    fontWeight: FontWeight.w400,
  );

  /// Buttons, chips and tab labels.
  static const TextStyle label = TextStyle(
    fontFamily: fontFamily,
    fontSize: 14,
    height: 1.2,
    fontWeight: FontWeight.w600,
  );

  /// Metadata: dates, counts, venues.
  static const TextStyle caption = TextStyle(
    fontFamily: fontFamily,
    fontSize: 12,
    height: 1.3,
    fontWeight: FontWeight.w500,
  );
}

/// Motion: short and ease-out, nothing bouncy (matches the web).
abstract final class AppMotion {
  /// Taps and toggles.
  static const Duration fast = Duration(milliseconds: 150);

  /// Page and sheet transitions.
  static const Duration normal = Duration(milliseconds: 200);

  /// The web's `cubic-bezier(0.22, 1, 0.36, 1)`.
  static const Curve easeOut = Cubic(0.22, 1, 0.36, 1);
}
