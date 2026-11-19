import 'package:event_tree/core/theme/tokens.dart';
import 'package:event_tree/core/util/format.dart';
import 'package:event_tree/core/widgets/category_icon.dart';
import 'package:event_tree/core/widgets/safe_network_image.dart';
import 'package:event_tree/core/widgets/status_badge.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:flutter/material.dart';

/// One card in the "This week" carousel.
///
/// Narrow on purpose: three fit across a 360 dp phone, so the row reads
/// as something to scroll rather than a second list.
class WeekCard extends StatelessWidget {
  /// Shows [event] as a poster with its title and start time under it.
  const new({required this.event, this.onTap, super.key});

  /// The event to show.
  final EventDto event;

  /// Opens the event.
  final VoidCallback? onTap;

  /// How wide one card is.
  static const double width = 150;

  @override
  Widget build(BuildContext context) {
    final start = event.startsAtLocal;
    final live = event.status == EventStatus.live;
    final when = live
        ? 'Happening now'
        : start == null
        ? ''
        : '${Format.shortDate(start)} · ${Format.time(start)}';
    return Semantics(
      button: true,
      label: [event.title, when].where((p) => p.isNotEmpty).join('. '),
      excludeSemantics: true,
      child: SizedBox(
        width: width,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppRadii.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Stack(
                children: [
                  ClipRRect(
                    borderRadius: BorderRadius.circular(AppRadii.md),
                    child: AspectRatio(
                      aspectRatio: 16 / 9,
                      child: SafeNetworkImage(
                        url: event.coverImage?.url ?? '',
                        fallback: ColoredBox(
                          color: AppColors.surfaceRaised,
                          child: Icon(
                            iconForCategory(event.category),
                            color: AppColors.textSubtle,
                            size: 28,
                          ),
                        ),
                      ),
                    ),
                  ),
                  if (live)
                    const Positioned(
                      left: AppSpacing.sm,
                      bottom: AppSpacing.sm,
                      child: StatusBadge(status: EventStatus.live),
                    ),
                ],
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                event.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: AppType.label.copyWith(
                  fontSize: 15,
                  fontWeight: FontWeight.w700,
                  height: 1.25,
                ),
              ),
              if (when.isNotEmpty) ...[
                const SizedBox(height: 2),
                Text(
                  when,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: AppType.caption.copyWith(
                    color: live ? AppColors.accent : AppColors.textMuted,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}
