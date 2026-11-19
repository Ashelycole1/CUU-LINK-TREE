import 'package:event_tree/core/theme/tokens.dart';
import 'package:flutter/material.dart';

/// The Spotify-style dark theme for the app's own screens (plan §4).
///
/// The colour scheme is written by hand from [AppColors] rather than
/// generated from a seed, so every surface matches the web exactly.
abstract final class AppTheme {
  /// The only app theme. A host's page is styled from their own appearance.
  static ThemeData dark() {
    const scheme = ColorScheme(
      brightness: Brightness.dark,
      primary: AppColors.accent,
      onPrimary: AppColors.onAccent,
      secondary: AppColors.text,
      onSecondary: AppColors.background,
      error: AppColors.danger,
      onError: AppColors.background,
      surface: AppColors.background,
      onSurface: AppColors.text,
      onSurfaceVariant: AppColors.textMuted,
      surfaceContainerLowest: AppColors.background,
      surfaceContainerLow: AppColors.surface,
      surfaceContainer: AppColors.surface,
      surfaceContainerHigh: AppColors.surfaceRaised,
      surfaceContainerHighest: AppColors.surfaceRaised,
      outline: AppColors.borderStrong,
      outlineVariant: AppColors.border,
    );

    const textTheme = TextTheme(
      displaySmall: AppType.display,
      headlineSmall: AppType.heading,
      titleMedium: AppType.title,
      bodyLarge: AppType.body,
      bodyMedium: AppType.body,
      labelLarge: AppType.label,
      labelMedium: AppType.label,
      bodySmall: AppType.caption,
      labelSmall: AppType.caption,
    );

    final pill = RoundedRectangleBorder(
      borderRadius: BorderRadius.circular(AppRadii.pill),
    );

    return ThemeData(
      useMaterial3: true,
      brightness: Brightness.dark,
      colorScheme: scheme,
      fontFamily: AppType.fontFamily,
      scaffoldBackgroundColor: AppColors.background,
      canvasColor: AppColors.background,
      textTheme: textTheme.apply(
        bodyColor: AppColors.text,
        displayColor: AppColors.text,
      ),
      iconTheme: const IconThemeData(color: AppColors.text, size: 24),
      dividerTheme: const DividerThemeData(
        color: AppColors.border,
        thickness: 1,
        space: 1,
      ),
      appBarTheme: const AppBarTheme(
        backgroundColor: AppColors.background,
        foregroundColor: AppColors.text,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: false,
        titleTextStyle: AppType.title,
      ),
      cardTheme: CardThemeData(
        color: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        margin: EdgeInsets.zero,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.lg),
        ),
      ),
      // Spotify-style tabs: no pill indicator, white when selected,
      // muted otherwise. The accent is kept for actions.
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        indicatorColor: Colors.transparent,
        elevation: 0,
        height: 64,
        labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
        iconTheme: WidgetStateProperty.resolveWith(
          (states) => IconThemeData(
            size: 24,
            color: states.contains(WidgetState.selected)
                ? AppColors.text
                : AppColors.textSubtle,
          ),
        ),
        labelTextStyle: WidgetStateProperty.resolveWith(
          (states) => AppType.caption.copyWith(
            color: states.contains(WidgetState.selected)
                ? AppColors.text
                : AppColors.textSubtle,
            fontWeight: states.contains(WidgetState.selected)
                ? FontWeight.w700
                : FontWeight.w500,
          ),
        ),
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          backgroundColor: AppColors.accent,
          foregroundColor: AppColors.onAccent,
          minimumSize: const Size(AppSpacing.touch, AppSpacing.touch),
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
          textStyle: AppType.label.copyWith(fontWeight: FontWeight.w700),
          shape: pill,
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: AppColors.text,
          minimumSize: const Size(AppSpacing.touch, AppSpacing.touch),
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
          side: const BorderSide(color: AppColors.textSubtle),
          textStyle: AppType.label.copyWith(fontWeight: FontWeight.w700),
          shape: pill,
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: AppColors.text,
          minimumSize: const Size(AppSpacing.touch, AppSpacing.touch),
          textStyle: AppType.label,
        ),
      ),
      chipTheme: ChipThemeData(
        backgroundColor: AppColors.surfaceRaised,
        selectedColor: AppColors.text,
        labelStyle: AppType.label.copyWith(color: AppColors.text),
        secondaryLabelStyle: AppType.label.copyWith(
          color: AppColors.background,
        ),
        side: BorderSide.none,
        shape: pill,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: AppColors.surfaceRaised,
        hintStyle: AppType.body.copyWith(color: AppColors.textSubtle),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.md),
          borderSide: BorderSide.none,
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(AppRadii.md),
          borderSide: const BorderSide(color: AppColors.text),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: AppColors.text,
        contentTextStyle: AppType.body.copyWith(color: AppColors.background),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadii.md),
        ),
      ),
      progressIndicatorTheme: const ProgressIndicatorThemeData(
        color: AppColors.text,
      ),
    );
  }
}
