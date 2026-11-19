import 'package:event_tree/core/theme/tokens.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:flutter/material.dart';

/// A small pill saying whether an event is live, upcoming or over.
///
/// Live is the only one that uses the accent, and it carries a dot, so
/// the state does not rest on colour alone.
class StatusBadge extends StatelessWidget {
  /// Shows [status], optionally with [label] in place of the default.
  const new({required this.status, this.label, super.key});

  /// Which state to show.
  final EventStatus status;

  /// Replaces the default wording, for example "Happening now".
  final String? label;

  @override
  Widget build(BuildContext context) {
    final live = status == EventStatus.live;
    final text = label ?? status.label;
    final foreground = live ? AppColors.accent : AppColors.textMuted;
    return Semantics(
      label: 'Status: $text',
      excludeSemantics: true,
      child: Container(
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm,
          vertical: AppSpacing.xs,
        ),
        decoration: BoxDecoration(
          color: AppColors.surfaceRaised,
          borderRadius: BorderRadius.circular(AppRadii.pill),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (live) ...[
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: AppColors.accent,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: AppSpacing.xs + 2),
            ],
            Text(
              text,
              style: AppType.caption.copyWith(
                color: foreground,
                fontWeight: live ? FontWeight.w700 : FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
