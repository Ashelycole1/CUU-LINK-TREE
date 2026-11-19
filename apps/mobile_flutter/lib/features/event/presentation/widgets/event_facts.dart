import 'package:event_tree/core/theme/page_theme.dart';
import 'package:event_tree/core/util/format.dart';
import 'package:event_tree/core/widgets/category_icon.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// When, where, who and how it was rated: one icon and one line each.
///
/// Anything the host left blank is left out rather than shown empty.
/// The rating is read from the event itself, which already carries the
/// summary; the reviews behind it arrive in phase 5.
class EventFacts extends StatelessWidget {
  /// Lists what is known about [event], in [theme].
  const new({required this.event, required this.theme, super.key});

  /// The event to describe.
  final EventDto event;

  /// The host's look.
  final PageTheme theme;

  @override
  Widget build(BuildContext context) {
    final rating = event.rating;
    final facts = <({IconData icon, String text})>[
      if (event.whenText.isNotEmpty)
        (icon: LucideIcons.calendarDays, text: event.whenText),
      if (event.venue.isNotEmpty) (icon: LucideIcons.mapPin, text: event.venue),
      if (event.organizer.isNotEmpty)
        (icon: LucideIcons.users, text: event.organizer),
      if (event.category.isNotEmpty)
        (
          icon: iconForCategory(event.category),
          text: normalizeCategory(event.category),
        ),
      if (rating.count > 0)
        (
          icon: LucideIcons.star,
          text: '${rating.average} · ${Format.reviewCount(rating.count)}',
        ),
    ];
    if (facts.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        for (final fact in facts)
          Padding(
            padding: const EdgeInsets.only(bottom: 10),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.only(top: 2),
                  child: Icon(fact.icon, size: 17, color: theme.muted),
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    fact.text,
                    style: theme.textStyle(size: 15, height: 1.4),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }
}
