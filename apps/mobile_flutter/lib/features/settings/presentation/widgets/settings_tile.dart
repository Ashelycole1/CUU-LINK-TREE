import 'package:event_tree/core/theme/tokens.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// One row in Profile: an icon, a title, and a line explaining it.
///
/// The explanation is not optional. A switch whose meaning is a guess
/// is a switch nobody touches, so every row says plainly what it does.
class SettingsTile extends StatelessWidget {
  /// Creates a row titled [title].
  const new({
    required this.icon,
    required this.title,
    required this.subtitle,
    this.onTap,
    this.trailing,
    super.key,
  });

  /// The mark on the left. Never an emoji.
  final IconData icon;

  /// What the row is.
  final String title;

  /// One or two lines saying what it does.
  final String subtitle;

  /// What happens on a tap, if anything.
  final VoidCallback? onTap;

  /// A switch or similar on the right, instead of the chevron.
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final trailing = this.trailing;
    final tappable = onTap != null;
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg,
          vertical: AppSpacing.md,
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Icon(icon, size: 20, color: AppColors.textMuted),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: AppType.title),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: AppType.caption.copyWith(
                      color: AppColors.textMuted,
                      height: 1.4,
                    ),
                  ),
                ],
              ),
            ),
            if (trailing != null)
              Padding(
                padding: const EdgeInsets.only(left: AppSpacing.md),
                child: trailing,
              )
            else if (tappable)
              const Padding(
                padding: EdgeInsets.only(left: AppSpacing.md, top: 2),
                child: Icon(
                  LucideIcons.chevronRight,
                  size: 18,
                  color: AppColors.textSubtle,
                ),
              ),
          ],
        ),
      ),
    );
  }
}
