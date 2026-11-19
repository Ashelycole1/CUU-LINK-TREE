import 'dart:async';

import 'package:add_2_calendar/add_2_calendar.dart' as cal;
import 'package:event_tree/core/theme/page_theme.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// Save and Add to calendar, under an event's title.
///
/// Saving is what schedules the reminders (plan §5.1), so the button
/// says what it buys rather than just "Save". Add to calendar hands the
/// event to whatever calendar the phone already uses, which costs us no
/// server and works offline.
class EventActions extends StatelessWidget {
  /// Shows the actions for [event] in [theme].
  const new({
    required this.event,
    required this.theme,
    required this.saved,
    required this.onToggleSave,
    super.key,
  });

  /// The event being shown.
  final EventDto event;

  /// The host's look.
  final PageTheme theme;

  /// Whether this phone has the event saved.
  final bool saved;

  /// Saves or forgets the event.
  final VoidCallback onToggleSave;

  @override
  Widget build(BuildContext context) {
    final past = event.status == EventStatus.past;
    return Row(
      children: [
        Expanded(
          child: _Action(
            theme: theme,
            filled: saved,
            icon: saved ? LucideIcons.bookmarkCheck : LucideIcons.bookmark,
            label: saved ? 'Saved' : 'Save',
            hint: saved ? 'Remove from saved' : 'Save and get a reminder',
            onTap: onToggleSave,
          ),
        ),
        if (!past) ...[
          const SizedBox(width: 10),
          Expanded(
            child: _Action(
              theme: theme,
              filled: false,
              icon: LucideIcons.calendarPlus,
              label: 'Calendar',
              hint: 'Add to your calendar',
              onTap: () => unawaited(_addToCalendar(event)),
            ),
          ),
        ],
      ],
    );
  }

  static Future<void> _addToCalendar(EventDto event) async {
    final start = event.startsAtLocal;
    if (start == null) return;
    await cal.Add2Calendar.addEvent2Cal(
      cal.Event(
        title: event.title,
        description: event.description,
        location: event.venue,
        startDate: start,
        endDate: event.endsAtLocal ?? start.add(const Duration(hours: 2)),
      ),
    );
  }
}

/// One of the two buttons: filled when it is on, outlined when it is
/// not.
class _Action extends StatelessWidget {
  const new({
    required this.theme,
    required this.filled,
    required this.icon,
    required this.label,
    required this.hint,
    required this.onTap,
  });

  final PageTheme theme;
  final bool filled;
  final IconData icon;
  final String label;
  final String hint;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final foreground = filled ? theme.onAccent : theme.text;
    return Semantics(
      button: true,
      label: hint,
      excludeSemantics: true,
      child: Material(
        color: filled ? theme.accent : Colors.transparent,
        borderRadius: BorderRadius.circular(999),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(999),
          child: Container(
            constraints: const BoxConstraints(minHeight: 48),
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(999),
              border: filled
                  ? null
                  : Border.all(color: theme.text.withValues(alpha: 0.4)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(icon, size: 18, color: foreground),
                const SizedBox(width: 8),
                Text(
                  label,
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
