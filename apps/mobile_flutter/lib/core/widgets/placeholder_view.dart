import 'package:event_tree/core/theme/tokens.dart';
import 'package:flutter/material.dart';

/// A screen's big title over a quiet card that says what will live there.
///
/// Used by the phase-1 skeleton screens until each one is built.
class PlaceholderView extends StatelessWidget {
  /// Creates a titled placeholder with an [icon], a [heading] and a
  /// [message].
  const new({
    required this.title,
    required this.icon,
    required this.heading,
    required this.message,
    this.footer,
    super.key,
  });

  /// The screen title, shown large at the top ("Discover").
  final String title;

  /// The icon in the card. Never an emoji.
  final IconData icon;

  /// The card's one-line heading.
  final String heading;

  /// One or two sentences under [heading].
  final String message;

  /// Optional small print under the card.
  final String? footer;

  @override
  Widget build(BuildContext context) {
    final footer = this.footer;
    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsetsDirectional.fromSTEB(
          AppSpacing.lg,
          AppSpacing.xl,
          AppSpacing.lg,
          AppSpacing.xl,
        ),
        children: [
          Semantics(header: true, child: Text(title, style: AppType.display)),
          const SizedBox(height: AppSpacing.xl),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.xl),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    width: AppSpacing.touch,
                    height: AppSpacing.touch,
                    decoration: BoxDecoration(
                      color: AppColors.surfaceRaised,
                      borderRadius: BorderRadius.circular(AppRadii.md),
                    ),
                    child: Icon(icon, color: AppColors.textMuted),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  Text(heading, style: AppType.title),
                  const SizedBox(height: AppSpacing.xs),
                  Text(
                    message,
                    style: AppType.body.copyWith(color: AppColors.textMuted),
                  ),
                ],
              ),
            ),
          ),
          if (footer != null) ...[
            const SizedBox(height: AppSpacing.lg),
            Text(
              footer,
              style: AppType.caption.copyWith(color: AppColors.textSubtle),
            ),
          ],
        ],
      ),
    );
  }
}
