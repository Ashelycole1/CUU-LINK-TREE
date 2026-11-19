import 'package:event_tree/core/theme/page_theme.dart';
import 'package:event_tree/core/widgets/category_icon.dart';
import 'package:event_tree/core/widgets/countdown.dart';
import 'package:event_tree/core/widgets/safe_network_image.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:flutter/material.dart';

/// The top of an event: poster, what kind of event it is, the title and
/// the live countdown.
///
/// The wording follows the event's life, as the web page does: a
/// countdown before it starts, "Happening now" while it is on, and
/// neither once it is over.
class EventHero extends StatelessWidget {
  /// Draws the top of [event] in [theme].
  const new({required this.event, required this.theme, super.key});

  /// The event to show.
  final EventDto event;

  /// The host's look.
  final PageTheme theme;

  @override
  Widget build(BuildContext context) {
    final alt = event.coverImage?.alt ?? '';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(14),
          child: AspectRatio(
            aspectRatio: 16 / 9,
            child: SafeNetworkImage(
              url: event.coverImage?.url ?? '',
              semanticLabel: alt.isEmpty ? null : alt,
              fallback: ColoredBox(
                color: theme.card,
                child: Icon(
                  iconForCategory(event.category),
                  size: 40,
                  color: theme.cardText.withValues(alpha: 0.6),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 20),
        _Kind(event: event, theme: theme),
        const SizedBox(height: 6),
        Semantics(
          header: true,
          child: Text(
            event.title,
            style: theme.textStyle(
              size: 26,
              weight: FontWeight.w800,
              height: 1.2,
              letterSpacing: -0.52,
            ),
          ),
        ),
        if (event.status != EventStatus.past) ...[
          const SizedBox(height: 10),
          _EventCountdown(event: event, theme: theme),
        ],
      ],
    );
  }
}

/// "UPCOMING EVENT", "HAPPENING NOW" or "PAST EVENT", with a live dot
/// when the event is on.
class _Kind extends StatelessWidget {
  const new({required this.event, required this.theme});

  final EventDto event;
  final PageTheme theme;

  @override
  Widget build(BuildContext context) {
    final live = event.status == EventStatus.live;
    final text = switch (event.status) {
      EventStatus.upcoming => 'Upcoming event',
      EventStatus.live => 'Happening now',
      EventStatus.past => 'Past event',
    };
    return Row(
      children: [
        if (live)
          Container(
            width: 8,
            height: 8,
            margin: const EdgeInsets.only(right: 6),
            decoration: BoxDecoration(
              color: theme.accent,
              shape: BoxShape.circle,
            ),
          ),
        Text(
          text.toUpperCase(),
          style: theme.textStyle(
            size: 12,
            weight: FontWeight.w700,
            letterSpacing: 0.72,
            color: live ? theme.accent : theme.muted,
          ),
        ),
      ],
    );
  }
}

/// The live countdown under the title, or nothing when the dates cannot
/// be read.
class _EventCountdown extends StatelessWidget {
  const new({required this.event, required this.theme});

  final EventDto event;
  final PageTheme theme;

  @override
  Widget build(BuildContext context) {
    final start = event.startsAtLocal;
    final end = event.endsAtLocal;
    if (start == null || end == null) return const SizedBox.shrink();
    return Countdown(
      startsAt: start,
      endsAt: end,
      style: theme.textStyle(size: 18, weight: FontWeight.w700),
    );
  }
}
