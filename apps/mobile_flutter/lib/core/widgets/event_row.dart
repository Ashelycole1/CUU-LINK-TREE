import 'package:event_tree/core/theme/tokens.dart';
import 'package:event_tree/core/widgets/category_icon.dart';
import 'package:event_tree/core/widgets/safe_network_image.dart';
import 'package:event_tree/core/widgets/status_badge.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:flutter/material.dart';

/// One event in a list on the app's own dark screens.
///
/// This is the app-chrome twin of `EventTile`: the tile wears a host's
/// colours on their page, this row stays in the Spotify-style dark
/// theme for Discover and, from phase 3, Saved.
class EventRow extends StatelessWidget {
  /// Shows [event], with the host's handle underneath when given.
  const new({
    required this.event,
    this.hostUsername = '',
    this.hostAvatarUrl = '',
    this.onTap,
    super.key,
  });

  /// The event to show.
  final EventDto event;

  /// The host's handle, shown without the `@`.
  final String hostUsername;

  /// The host's picture, shown as a small circle.
  final String hostAvatarUrl;

  /// Opens the event.
  final VoidCallback? onTap;

  static const double _thumb = 64;

  @override
  Widget build(BuildContext context) {
    final live = event.status == EventStatus.live;
    return Semantics(
      button: true,
      label: [
        event.title,
        event.listSubtitle,
        if (hostUsername.isNotEmpty) 'by $hostUsername',
      ].where((p) => p.isNotEmpty).join('. '),
      excludeSemantics: true,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadii.md),
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.sm,
            vertical: AppSpacing.sm,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ClipRRect(
                borderRadius: BorderRadius.circular(AppRadii.md),
                child: SizedBox(
                  width: _thumb,
                  height: _thumb,
                  child: SafeNetworkImage(
                    url: event.coverImage?.url ?? '',
                    fallback: ColoredBox(
                      color: AppColors.surfaceRaised,
                      child: Icon(
                        iconForCategory(event.category),
                        color: AppColors.textSubtle,
                        size: 24,
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
                    Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Expanded(
                          child: Text(
                            event.title,
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: AppType.title,
                          ),
                        ),
                        if (live) ...[
                          const SizedBox(width: AppSpacing.sm),
                          const StatusBadge(status: EventStatus.live),
                        ],
                      ],
                    ),
                    const SizedBox(height: 2),
                    Text(
                      event.listSubtitle,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: AppType.caption.copyWith(
                        color: AppColors.textMuted,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs + 2),
                    _HostLine(
                      username: hostUsername,
                      avatarUrl: hostAvatarUrl,
                      category: event.category,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// The host's handle on the left and the category icon on the right.
class _HostLine extends StatelessWidget {
  const new({
    required this.username,
    required this.avatarUrl,
    required this.category,
  });

  final String username;
  final String avatarUrl;
  final String category;

  @override
  Widget build(BuildContext context) {
    final style = AppType.caption.copyWith(color: AppColors.textSubtle);
    return Row(
      children: [
        if (username.isNotEmpty) ...[
          ClipOval(
            child: SizedBox(
              width: 16,
              height: 16,
              child: SafeNetworkImage(
                url: avatarUrl,
                fallback: const ColoredBox(color: AppColors.surfaceRaised),
              ),
            ),
          ),
          const SizedBox(width: AppSpacing.xs + 2),
          Flexible(
            child: Text(
              username,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: style,
            ),
          ),
        ],
        const Spacer(),
        Icon(iconForCategory(category), size: 14, color: AppColors.textSubtle),
        const SizedBox(width: AppSpacing.xs),
        Text(normalizeCategory(category), style: style),
      ],
    );
  }
}
