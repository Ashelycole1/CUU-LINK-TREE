import 'package:event_tree/core/theme/page_theme.dart';
import 'package:event_tree/core/theme/tokens.dart';
import 'package:flutter/material.dart';

/// A round translucent button that floats over a host's page.
///
/// It takes its colours from the host's [theme] so it reads on any
/// background, and falls back to the dark app palette while the page is
/// still loading.
class GlassButton extends StatelessWidget {
  /// Shows [icon], described to screen readers as [label].
  const new({
    required this.icon,
    required this.label,
    required this.onTap,
    this.theme,
    super.key,
  });

  /// The mark inside the circle. Never an emoji.
  final IconData icon;

  /// What the button does, for screen readers and the tooltip.
  final String label;

  /// What happens on a tap.
  final VoidCallback onTap;

  /// The host's look, or null before the page has loaded.
  final PageTheme? theme;

  @override
  Widget build(BuildContext context) {
    final theme = this.theme;
    final foreground = theme?.text ?? AppColors.text;
    final background = theme?.glass ?? AppColors.surfaceRaised;
    return Tooltip(
      message: label,
      child: Semantics(
        button: true,
        label: label,
        excludeSemantics: true,
        child: SizedBox(
          width: AppSpacing.touch,
          height: AppSpacing.touch,
          child: Material(
            color: background,
            shape: const CircleBorder(),
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: onTap,
              child: Icon(icon, size: 20, color: foreground),
            ),
          ),
        ),
      ),
    );
  }
}
