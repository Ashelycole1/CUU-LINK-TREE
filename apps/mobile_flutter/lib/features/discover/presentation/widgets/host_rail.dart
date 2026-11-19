import 'package:event_tree/core/theme/page_theme.dart';
import 'package:event_tree/core/theme/tokens.dart';
import 'package:event_tree/core/widgets/safe_network_image.dart';
import 'package:event_tree/data/models/community.dart';
import 'package:flutter/material.dart';

/// The row of hosts under the Discover feed.
///
/// Every registered page appears here, those with upcoming events
/// first, which is the order the server returns them in. It is how a
/// student finds a club they have not heard of yet.
class HostRail extends StatelessWidget {
  /// Shows [pages] as circular avatars, opening one through [onOpen].
  const new({required this.pages, required this.onOpen, super.key});

  /// Every registered page, in the server's order.
  final List<CommunityPageDto> pages;

  /// Called with the username of the host tapped.
  final ValueChanged<String> onOpen;

  static const double _avatar = 64;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: _avatar + 34,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        itemCount: pages.length,
        separatorBuilder: (context, _) => const SizedBox(width: AppSpacing.lg),
        itemBuilder: (context, index) {
          final page = pages[index];
          return _Host(page: page, onTap: () => onOpen(page.username));
        },
      ),
    );
  }
}

/// One host: their picture over their handle.
class _Host extends StatelessWidget {
  const new({required this.page, required this.onTap});

  final CommunityPageDto page;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final ring = parseHexColor(page.color, AppColors.surfaceRaised);
    final name = page.displayName.isNotEmpty ? page.displayName : page.username;
    return Semantics(
      button: true,
      label: '$name, ${page.upcoming} upcoming',
      excludeSemantics: true,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppRadii.md),
        child: SizedBox(
          width: HostRail._avatar + AppSpacing.sm,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: const EdgeInsets.all(2),
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: ring, width: 2),
                ),
                child: ClipOval(
                  child: SizedBox(
                    width: HostRail._avatar - 8,
                    height: HostRail._avatar - 8,
                    child: SafeNetworkImage(
                      url: page.avatarUrl,
                      fallback: ColoredBox(
                        color: AppColors.surfaceRaised,
                        child: Center(
                          child: Text(
                            _initial(name),
                            style: AppType.title.copyWith(
                              color: AppColors.textMuted,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                page.username,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: AppType.caption.copyWith(color: AppColors.textMuted),
              ),
            ],
          ),
        ),
      ),
    );
  }

  static String _initial(String name) =>
      name.isEmpty ? '?' : name.substring(0, 1).toUpperCase();
}
