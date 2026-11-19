import 'package:event_tree/core/theme/page_theme.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// One of an event's links, as a full-width button.
///
/// The host marks one or more links primary; those are filled with the
/// host's accent and come first, the rest are outlined. The icons
/// replace the web's emoji map (plan §4).
class EventLinkButton extends StatelessWidget {
  /// Draws [link] in [theme] and calls [onTap] when pressed.
  const new({
    required this.link,
    required this.theme,
    required this.onTap,
    super.key,
  });

  /// The link to show.
  final EventLinkDto link;

  /// The host's look.
  final PageTheme theme;

  /// Opens the link.
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final filled = link.primary;
    final foreground = filled ? theme.onAccent : theme.text;
    final label = link.label.isNotEmpty ? link.label : _fallbackLabel;
    return Semantics(
      button: true,
      link: true,
      label: label,
      excludeSemantics: true,
      child: Material(
        color: filled ? theme.accent : Colors.transparent,
        borderRadius: BorderRadius.circular(999),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(999),
          child: Container(
            constraints: const BoxConstraints(minHeight: 52),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(999),
              border: filled
                  ? null
                  : Border.all(color: theme.text.withValues(alpha: 0.4)),
            ),
            padding: const EdgeInsets.symmetric(horizontal: 18),
            child: Row(
              children: [
                Icon(iconForLinkKind(link.kind), size: 18, color: foreground),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    label,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: theme.textStyle(
                      size: 15,
                      weight: FontWeight.w700,
                      color: foreground,
                    ),
                  ),
                ),
                Icon(
                  LucideIcons.arrowUpRight,
                  size: 16,
                  color: foreground.withValues(alpha: 0.7),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String get _fallbackLabel => switch (link.kind) {
    EventLinkKind.register => 'Register',
    EventLinkKind.tickets => 'Get tickets',
    EventLinkKind.agenda => 'Agenda',
    EventLinkKind.livestream => 'Watch live',
    EventLinkKind.slides => 'Slides',
    EventLinkKind.photos => 'Photos',
    EventLinkKind.recording => 'Recording',
    EventLinkKind.other => 'Open link',
  };
}

/// A Lucide mark for each link kind, replacing the web's `LINK_ICONS`
/// emoji map.
IconData iconForLinkKind(EventLinkKind kind) => switch (kind) {
  EventLinkKind.register => LucideIcons.penLine,
  EventLinkKind.tickets => LucideIcons.ticket,
  EventLinkKind.agenda => LucideIcons.calendarDays,
  EventLinkKind.livestream => LucideIcons.radio,
  EventLinkKind.slides => LucideIcons.presentation,
  EventLinkKind.photos => LucideIcons.camera,
  EventLinkKind.recording => LucideIcons.video,
  EventLinkKind.other => LucideIcons.link,
};
