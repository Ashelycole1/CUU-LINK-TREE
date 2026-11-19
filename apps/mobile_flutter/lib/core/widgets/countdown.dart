import 'dart:async';

import 'package:event_tree/core/util/format.dart';
import 'package:flutter/material.dart';

/// A live "in 3d 4h" that keeps itself up to date.
///
/// It redraws every 30 seconds, which is enough for a minute-by-minute
/// countdown and costs almost nothing, and it stops once the event has
/// ended. The timer is cancelled in `dispose` (plan §7, rule 6).
class Countdown extends StatefulWidget {
  /// Counts down to [startsAt], then shows "Happening now" until
  /// [endsAt].
  const new({
    required this.startsAt,
    required this.endsAt,
    this.style,
    super.key,
  });

  /// When the event begins.
  final DateTime startsAt;

  /// When it finishes.
  final DateTime endsAt;

  /// The text style; defaults to the surrounding one.
  final TextStyle? style;

  @override
  State<Countdown> createState() => _CountdownState();
}

class _CountdownState extends State<Countdown> {
  static const Duration _tick = Duration(seconds: 30);

  Timer? _timer;

  @override
  void initState() {
    super.initState();
    _schedule();
  }

  @override
  void didUpdateWidget(Countdown oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.startsAt != widget.startsAt ||
        oldWidget.endsAt != widget.endsAt) {
      _schedule();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  void _schedule() {
    _timer?.cancel();
    if (_ended) return;
    _timer = Timer.periodic(_tick, (_) {
      if (!mounted) return;
      setState(() {});
      if (_ended) _timer?.cancel();
    });
  }

  bool get _ended => !DateTime.now().isBefore(widget.endsAt);

  @override
  Widget build(BuildContext context) {
    final text = Format.countdown(widget.startsAt, widget.endsAt);
    return Text(text, style: widget.style);
  }
}
