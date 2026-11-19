import 'package:event_tree/core/theme/page_theme.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// Follow or Following, under a host's bio.
///
/// Following is a phone-side thing: it has no account behind it and
/// tells the server nothing. It just means background sync will check
/// this host for new events and say so (plan §5.2).
class FollowButton extends StatelessWidget {
  /// Shows the state in [following] and toggles it with [onToggle].
  const new({
    required this.following,
    required this.theme,
    required this.onToggle,
    super.key,
  });

  /// Whether this phone follows the host.
  final bool following;

  /// The host's look.
  final PageTheme theme;

  /// Follows or unfollows.
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) {
    final foreground = following ? theme.text : theme.onAccent;
    return Semantics(
      button: true,
      label: following ? 'Following. Tap to stop' : 'Follow for new events',
      excludeSemantics: true,
      child: Material(
        color: following ? Colors.transparent : theme.accent,
        borderRadius: BorderRadius.circular(999),
        child: InkWell(
          onTap: onToggle,
          borderRadius: BorderRadius.circular(999),
          child: Container(
            constraints: const BoxConstraints(minHeight: 44),
            padding: const EdgeInsets.symmetric(horizontal: 22),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(999),
              border: following
                  ? Border.all(color: theme.text.withValues(alpha: 0.4))
                  : null,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  following ? LucideIcons.check : LucideIcons.bellPlus,
                  size: 17,
                  color: foreground,
                ),
                const SizedBox(width: 8),
                Text(
                  following ? 'Following' : 'Follow',
                  style: theme.textStyle(
                    size: 15,
                    weight: FontWeight.w700,
                    color: foreground,
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
