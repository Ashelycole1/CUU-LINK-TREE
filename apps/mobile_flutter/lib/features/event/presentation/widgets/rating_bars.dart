import 'package:event_tree/core/theme/page_theme.dart';
import 'package:event_tree/core/util/format.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// How an event was rated: the average, then a bar per star.
///
/// The distribution matters more than the average for an event that
/// only a few people reviewed, which is most of them, so both are
/// shown rather than a single number.
class RatingBars extends StatelessWidget {
  /// Draws [rating] in [theme].
  const new({required this.rating, required this.theme, super.key});

  /// The summary the server computed.
  final RatingSummaryDto rating;

  /// The host's look.
  final PageTheme theme;

  @override
  Widget build(BuildContext context) {
    if (rating.count == 0) return const SizedBox.shrink();
    final most = rating.distribution.fold<int>(
      1,
      (best, value) => value > best ? value : best,
    );
    return Semantics(
      label:
          'Rated ${rating.average} out of 5 from '
          '${Format.reviewCount(rating.count)}',
      excludeSemantics: true,
      child: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                '${rating.average}',
                style: theme.textStyle(
                  size: 36,
                  weight: FontWeight.w800,
                  height: 1,
                ),
              ),
              const SizedBox(height: 4),
              Row(
                children: [
                  for (var star = 1; star <= 5; star++)
                    Icon(
                      LucideIcons.star,
                      size: 13,
                      color: star <= rating.average.round()
                          ? theme.accent
                          : theme.text.withValues(alpha: 0.25),
                    ),
                ],
              ),
              const SizedBox(height: 4),
              Text(
                Format.reviewCount(rating.count),
                style: theme.textStyle(size: 13, color: theme.muted),
              ),
            ],
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              children: [
                for (var star = 5; star >= 1; star--)
                  _Bar(
                    star: star,
                    count: _countFor(star),
                    most: most,
                    theme: theme,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  /// Index 0 holds the 1-star reviews, index 4 the 5-star ones.
  int _countFor(int star) {
    final index = star - 1;
    final distribution = rating.distribution;
    return index >= 0 && index < distribution.length ? distribution[index] : 0;
  }
}

/// One star's row.
class _Bar extends StatelessWidget {
  const new({
    required this.star,
    required this.count,
    required this.most,
    required this.theme,
  });

  final int star;
  final int count;
  final int most;
  final PageTheme theme;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(vertical: 2),
    child: Row(
      children: [
        SizedBox(
          width: 12,
          child: Text(
            '$star',
            style: theme.textStyle(size: 12, color: theme.muted),
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: ClipRRect(
            borderRadius: BorderRadius.circular(999),
            child: LinearProgressIndicator(
              value: most == 0 ? 0 : count / most,
              minHeight: 6,
              backgroundColor: theme.text.withValues(alpha: 0.12),
              valueColor: AlwaysStoppedAnimation<Color>(theme.accent),
            ),
          ),
        ),
        const SizedBox(width: 8),
        SizedBox(
          width: 20,
          child: Text(
            '$count',
            textAlign: TextAlign.end,
            style: theme.textStyle(size: 12, color: theme.muted),
          ),
        ),
      ],
    ),
  );
}
