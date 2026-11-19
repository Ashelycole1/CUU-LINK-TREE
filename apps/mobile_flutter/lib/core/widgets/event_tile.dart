import 'package:event_tree/core/theme/page_theme.dart';
import 'package:event_tree/core/util/format.dart';
import 'package:event_tree/core/widgets/category_icon.dart';
import 'package:event_tree/core/widgets/safe_network_image.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:event_tree/data/models/profile.dart';
import 'package:flutter/material.dart';

/// One event on a host's page: a full-width button in the host's own
/// style.
///
/// The Dart twin of `apps/web/src/components/tree/EventTicket.tsx`, so a
/// page looks the same in the app as it does in a browser. In the house
/// `ticket` style the right end is a perforated stub carrying the date;
/// the other three styles put the date in the line under the title.
class EventTile extends StatelessWidget {
  /// Draws [event] in [theme]'s button style.
  const new({
    required this.event,
    required this.theme,
    this.onTap,
    this.dimmed = false,
    super.key,
  });

  /// The event to show.
  final EventDto event;

  /// The host's look.
  final PageTheme theme;

  /// Opens the event.
  final VoidCallback? onTap;

  /// Fades the tile, as the web does for past events.
  final bool dimmed;

  static const double _minHeight = 72;
  static const double _stubWidth = 74;
  static const double _thumbSize = 52;

  bool get _hasStub => theme.buttonStyle == PageButtonStyle.ticket;

  bool get _isOutline => theme.buttonStyle == PageButtonStyle.outline;

  double get _radius => switch (theme.buttonStyle) {
    PageButtonStyle.ticket => 14,
    PageButtonStyle.pill => 999,
    PageButtonStyle.outline => 12,
    PageButtonStyle.shadow => 6,
  };

  @override
  Widget build(BuildContext context) {
    final foreground = _isOutline ? theme.text : theme.cardText;
    final radius = BorderRadius.circular(_radius);
    final tile = DecoratedBox(
      decoration: BoxDecoration(
        color: _isOutline ? Colors.transparent : theme.card,
        borderRadius: radius,
        border: switch (theme.buttonStyle) {
          PageButtonStyle.outline => Border.all(color: theme.text, width: 2),
          PageButtonStyle.shadow => Border.all(color: theme.cardText, width: 2),
          _ => null,
        },
        boxShadow: theme.buttonStyle == PageButtonStyle.shadow
            ? [BoxShadow(color: theme.cardText, offset: const Offset(5, 5))]
            : null,
      ),
      child: ConstrainedBox(
        constraints: const BoxConstraints(minHeight: _minHeight),
        child: Row(
          children: [
            Expanded(
              child: _Main(tile: this, foreground: foreground),
            ),
            if (_hasStub) _Stub(tile: this, foreground: foreground),
          ],
        ),
      ),
    );

    return Semantics(
      button: true,
      label: _semanticLabel,
      excludeSemantics: true,
      child: Padding(
        // Leaves room for the hard offset shadow.
        padding: EdgeInsets.only(
          right: theme.buttonStyle == PageButtonStyle.shadow ? 5 : 0,
          bottom: theme.buttonStyle == PageButtonStyle.shadow ? 5 : 0,
        ),
        child: Opacity(
          opacity: dimmed ? 0.78 : 1,
          child: Material(
            type: MaterialType.transparency,
            child: InkWell(onTap: onTap, borderRadius: radius, child: tile),
          ),
        ),
      ),
    );
  }

  String get _semanticLabel {
    final parts = [event.title, _meta, if (dimmed) 'Past event'];
    return parts.where((p) => p.isNotEmpty).join('. ');
  }

  /// The line under the title, worded as the web does.
  String get _meta {
    if (event.status == EventStatus.live) return 'Happening now';
    if (event.status == EventStatus.past && event.rating.count > 0) {
      return '${event.rating.average} · '
          '${Format.reviewCount(event.rating.count)}';
    }
    final where = event.venue.isNotEmpty ? event.venue : event.category;
    if (_hasStub) return where;
    final start = event.startsAtLocal;
    if (start == null) return where;
    final when = Format.shortDate(start);
    return where.isEmpty ? when : '$when · $where';
  }
}

/// The thumbnail and the centred title.
class _Main extends StatelessWidget {
  const new({required this.tile, required this.foreground});

  final EventTile tile;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    final theme = tile.theme;
    final pill = theme.buttonStyle == PageButtonStyle.pill;
    final meta = tile._meta;
    final live = tile.event.status == EventStatus.live;
    return Padding(
      padding: EdgeInsets.fromLTRB(pill ? 8 : 10, 10, pill ? 8 : 12, 10),
      child: Row(
        children: [
          ClipRRect(
            borderRadius: BorderRadius.circular(switch (theme.buttonStyle) {
              PageButtonStyle.pill => 999,
              PageButtonStyle.shadow => 4,
              _ => 10,
            }),
            child: SizedBox(
              width: EventTile._thumbSize,
              height: EventTile._thumbSize,
              child: SafeNetworkImage(
                url: tile.event.coverImage?.url ?? '',
                fallback: ColoredBox(
                  color: tile._isOutline ? theme.glass : theme.cardWell,
                  child: Icon(
                    iconForCategory(tile.event.category),
                    color: foreground.withValues(alpha: 0.7),
                    size: 22,
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  tile.event.title,
                  textAlign: TextAlign.center,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textStyle(
                    size: 16,
                    weight: FontWeight.w800,
                    height: 1.25,
                    color: foreground,
                  ),
                ),
                if (meta.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  _Meta(
                    text: meta,
                    live: live,
                    color: foreground,
                    theme: theme,
                  ),
                ],
              ],
            ),
          ),
          // Balances the thumbnail so the title sits in the true centre.
          if (!tile._hasStub) const SizedBox(width: EventTile._thumbSize),
        ],
      ),
    );
  }
}

/// The line under the title, with a live dot when the event is on now.
class _Meta extends StatelessWidget {
  const new({
    required this.text,
    required this.live,
    required this.color,
    required this.theme,
  });

  final String text;
  final bool live;
  final Color color;
  final PageTheme theme;

  @override
  Widget build(BuildContext context) {
    final style = theme.textStyle(
      size: 13,
      weight: live ? FontWeight.w700 : FontWeight.w400,
      color: color.withValues(alpha: live ? 1 : 0.8),
    );
    final label = Flexible(
      child: Text(
        text,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
        style: style,
      ),
    );
    if (!live) {
      return Row(mainAxisSize: MainAxisSize.min, children: [label]);
    }
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 8,
          height: 8,
          margin: const EdgeInsets.only(right: 6),
          decoration: BoxDecoration(
            color: theme.accent,
            shape: BoxShape.circle,
          ),
        ),
        label,
      ],
    );
  }
}

/// The perforated date stub on the house ticket style.
class _Stub extends StatelessWidget {
  const new({required this.tile, required this.foreground});

  final EventTile tile;
  final Color foreground;

  @override
  Widget build(BuildContext context) {
    final start = tile.event.startsAtLocal;
    final parts = start == null
        ? (day: '–', month: '')
        : Format.dayMonth(start);
    return CustomPaint(
      painter: _PerforationPainter(
        line: tile.theme.perforation,
        notch: tile.theme.background,
      ),
      child: SizedBox(
        width: EventTile._stubWidth,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              parts.day,
              style: tile.theme.textStyle(
                size: 24,
                weight: FontWeight.w800,
                height: 1,
                color: foreground,
              ),
            ),
            if (parts.month.isNotEmpty) ...[
              const SizedBox(height: 3),
              Text(
                parts.month,
                style: tile.theme.textStyle(
                  size: 12,
                  weight: FontWeight.w700,
                  height: 1,
                  letterSpacing: 0.72,
                  color: foreground.withValues(alpha: 0.75),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

/// The dashed tear line and the two punched notches, as the web's
/// `.ticket--ticket .ticket-stub` draws them in CSS.
class _PerforationPainter extends CustomPainter {
  const new({required this.line, required this.notch});

  final Color line;
  final Color notch;

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = line
      ..strokeWidth = 2;
    const dash = 5.0;
    const gap = 4.0;
    for (var y = 0.0; y < size.height; y += dash + gap) {
      final end = (y + dash).clamp(0.0, size.height);
      canvas.drawLine(Offset(0, y), Offset(0, end), paint);
    }
    final punch = Paint()..color = notch;
    canvas
      ..drawCircle(Offset.zero, 9, punch)
      ..drawCircle(Offset(0, size.height), 9, punch);
  }

  @override
  bool shouldRepaint(_PerforationPainter oldDelegate) =>
      oldDelegate.line != line || oldDelegate.notch != notch;
}
