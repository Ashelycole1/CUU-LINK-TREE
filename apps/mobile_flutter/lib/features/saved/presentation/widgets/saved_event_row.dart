import 'package:event_tree/core/theme/tokens.dart';
import 'package:event_tree/core/widgets/category_icon.dart';
import 'package:event_tree/core/widgets/safe_network_image.dart';
import 'package:event_tree/data/models/saved_event.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// One saved event in the Saved tab.
///
/// Drawn from what is on the phone, so it reads with no connection.
/// Swiping is not used: a visible Remove button is easier to find and
/// easier to reach one-handed.
class SavedEventRow extends StatelessWidget {
  /// Shows [event], opening it with [onOpen] and forgetting it with
  /// [onRemove].
  const new({
    required this.event,
    required this.onOpen,
    required this.onRemove,
    super.key,
  });

  /// The saved event.
  final SavedEvent event;

  /// Opens the event's page.
  final VoidCallback onOpen;

  /// Forgets the event and cancels its reminders.
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: '${event.title}. ${event.subtitle}',
      excludeSemantics: true,
      child: InkWell(
        onTap: onOpen,
        borderRadius: BorderRadius.circular(AppRadii.md),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.sm),
          child: Row(
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(AppRadii.md),
                child: SizedBox(
                  width: 56,
                  height: 56,
                  child: SafeNetworkImage(
                    url: event.coverUrl,
                    fallback: ColoredBox(
                      color: AppColors.surfaceRaised,
                      child: Icon(
                        iconForCategory(event.category),
                        color: AppColors.textSubtle,
                        size: 22,
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      event.title,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: AppType.title,
                    ),
                    const SizedBox(height: 2),
                    Text(
                      event.subtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppType.caption.copyWith(
                        color: AppColors.textMuted,
                      ),
                    ),
                    Text(
                      '@${event.username}',
                      style: AppType.caption.copyWith(
                        color: AppColors.textSubtle,
                      ),
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: onRemove,
                tooltip: 'Remove from saved',
                icon: const Icon(LucideIcons.bookmarkX, size: 20),
                color: AppColors.textMuted,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
