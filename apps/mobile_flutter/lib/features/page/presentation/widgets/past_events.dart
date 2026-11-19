import 'package:event_tree/core/theme/page_theme.dart';
import 'package:event_tree/core/widgets/event_tile.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// Past events, folded away behind a toggle.
///
/// The web page does the same (`aria-expanded` on the toggle): upcoming
/// events come first because that is what a student is looking for, and
/// everything that has happened stays one tap away.
class PastEvents extends StatefulWidget {
  /// Shows [events] in [theme], opening one through [onOpen].
  const new({
    required this.events,
    required this.theme,
    required this.onOpen,
    super.key,
  });

  /// The host's finished events, newest first.
  final List<EventDto> events;

  /// The host's look.
  final PageTheme theme;

  /// Called with the event tapped.
  final ValueChanged<EventDto> onOpen;

  @override
  State<PastEvents> createState() => _PastEventsState();
}

class _PastEventsState extends State<PastEvents> {
  bool _open = false;

  @override
  Widget build(BuildContext context) {
    final theme = widget.theme;
    final label = 'Past events (${widget.events.length})';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        const SizedBox(height: 32),
        Semantics(
          button: true,
          expanded: _open,
          label: label,
          excludeSemantics: true,
          child: Material(
            color: theme.glass,
            borderRadius: BorderRadius.circular(999),
            child: InkWell(
              onTap: () => setState(() => _open = !_open),
              borderRadius: BorderRadius.circular(999),
              child: Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: 18,
                  vertical: 14,
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      _open ? LucideIcons.chevronUp : LucideIcons.chevronDown,
                      size: 18,
                      color: theme.text,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      label,
                      style: theme.textStyle(size: 15, weight: FontWeight.w700),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
        if (_open) ...[
          const SizedBox(height: 12),
          for (final event in widget.events)
            Padding(
              padding: const EdgeInsets.only(bottom: 14),
              child: EventTile(
                event: event,
                theme: theme,
                dimmed: true,
                onTap: () => widget.onOpen(event),
              ),
            ),
        ],
      ],
    );
  }
}
