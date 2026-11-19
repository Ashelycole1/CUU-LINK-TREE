import 'package:event_tree/core/theme/tokens.dart';
import 'package:flutter/widgets.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// What release builds show in place of a widget that failed to build,
/// instead of Flutter's red error screen (plan §7, rule 1).
///
/// It can appear anywhere in the tree, even above `MaterialApp`, so it only
/// uses `widgets.dart` and sets its own text direction.
class FriendlyError extends StatelessWidget {
  /// Creates the fallback shown by `ErrorWidget.builder` in release builds.
  const new({super.key});

  @override
  Widget build(BuildContext context) {
    return const Directionality(
      textDirection: TextDirection.ltr,
      child: ColoredBox(
        color: AppColors.background,
        child: Center(
          child: Padding(
            padding: EdgeInsets.all(AppSpacing.xl),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  LucideIcons.triangleAlert,
                  color: AppColors.textMuted,
                  size: 32,
                  semanticLabel: 'Error',
                ),
                SizedBox(height: AppSpacing.md),
                Text(
                  'Something went wrong here',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontFamily: AppType.fontFamily,
                    fontSize: 16,
                    fontWeight: FontWeight.w700,
                    color: AppColors.text,
                  ),
                ),
                SizedBox(height: AppSpacing.xs),
                Text(
                  'Go back and try again.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontFamily: AppType.fontFamily,
                    fontSize: 14,
                    color: AppColors.textMuted,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
