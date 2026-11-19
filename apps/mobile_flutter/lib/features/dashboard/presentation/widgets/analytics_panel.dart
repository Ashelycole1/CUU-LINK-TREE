import 'package:event_tree/core/theme/tokens.dart';
import 'package:event_tree/core/util/format.dart';
import 'package:event_tree/core/widgets/async_view.dart';
import 'package:event_tree/data/models/analytics_summary.dart';
import 'package:event_tree/features/dashboard/application/dashboard_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// What a host's page is doing: views, clicks and the busiest events.
///
/// Drawn by hand rather than with a charting package: three numbers and
/// a row of bars do not justify another dependency on a phone this app
/// has to stay small for (plan §2).
class AnalyticsPanel extends ConsumerWidget {
  /// Creates the panel.
  const new({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(myAnalyticsProvider);
    final days = ref.watch(analyticsDaysProvider);
    return AsyncView<AnalyticsSummaryDto>(
      value: summary,
      onRetry: () => ref.invalidate(myAnalyticsProvider),
      data: (loaded) => ListView(
        padding: const EdgeInsets.fromLTRB(
          AppSpacing.lg,
          0,
          AppSpacing.lg,
          AppSpacing.xxl,
        ),
        children: [
          _DayChoice(
            days: days,
            onChoose: (value) =>
                ref.read(analyticsDaysProvider.notifier).days = value,
          ),
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              _Stat(
                label: 'Views',
                value: '${loaded.views}',
                icon: LucideIcons.eye,
              ),
              const SizedBox(width: AppSpacing.md),
              _Stat(
                label: 'Clicks',
                value: '${loaded.clicks}',
                icon: LucideIcons.mousePointerClick,
              ),
              const SizedBox(width: AppSpacing.md),
              _Stat(
                label: 'Click rate',
                value: '${loaded.clickPercent}%',
                icon: LucideIcons.percent,
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.xl),
          if (loaded.series.isNotEmpty) ...[
            const _Heading('By day'),
            _Chart(summary: loaded),
          ],
          if (loaded.topEvents.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.xl),
            const _Heading('Most clicked'),
            for (final event in loaded.topEvents) _TopEvent(event: event),
          ],
          if (loaded.views == 0 && loaded.clicks == 0) ...[
            const SizedBox(height: AppSpacing.xl),
            Text(
              'Nothing yet for this stretch. Share your page link and '
              'these fill in.',
              style: AppType.body.copyWith(color: AppColors.textMuted),
            ),
          ],
        ],
      ),
    );
  }
}

/// How many days to show.
class _DayChoice extends StatelessWidget {
  const new({required this.days, required this.onChoose});

  final int days;
  final ValueChanged<int> onChoose;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      for (final choice in AnalyticsDays.choices)
        Padding(
          padding: const EdgeInsets.only(right: AppSpacing.sm),
          child: ChoiceChip(
            label: Text('$choice days'),
            selected: choice == days,
            onSelected: (_) => onChoose(choice),
          ),
        ),
    ],
  );
}

/// One of the three numbers at the top.
class _Stat extends StatelessWidget {
  const new({required this.label, required this.value, required this.icon});

  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Expanded(
    child: Semantics(
      label: '$label: $value',
      excludeSemantics: true,
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(icon, size: 16, color: AppColors.textSubtle),
              const SizedBox(height: AppSpacing.sm),
              FittedBox(
                child: Text(
                  value,
                  style: AppType.heading.copyWith(fontSize: 24),
                ),
              ),
              Text(
                label,
                style: AppType.caption.copyWith(color: AppColors.textMuted),
              ),
            ],
          ),
        ),
      ),
    ),
  );
}

/// A bar per day, views behind clicks.
class _Chart extends StatelessWidget {
  const new({required this.summary});

  final AnalyticsSummaryDto summary;

  @override
  Widget build(BuildContext context) {
    final busiest = summary.busiestDay;
    return Semantics(
      label:
          '${summary.views} views and ${summary.clicks} clicks over '
          '${summary.days} days',
      excludeSemantics: true,
      child: SizedBox(
        height: 140,
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            for (final day in summary.series)
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 1),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.end,
                    children: [
                      Container(
                        height: (day.views / busiest * 110).clamp(2, 110),
                        decoration: BoxDecoration(
                          color: AppColors.surfaceRaised,
                          borderRadius: BorderRadius.circular(2),
                        ),
                        child: Align(
                          alignment: Alignment.bottomCenter,
                          child: Container(
                            height: (day.clicks / busiest * 110).clamp(0, 110),
                            decoration: BoxDecoration(
                              color: AppColors.accent,
                              borderRadius: BorderRadius.circular(2),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        _dayLabel(day.date),
                        style: AppType.caption.copyWith(
                          fontSize: 9,
                          color: AppColors.textSubtle,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  /// Just the day of the month: anything longer collides on a phone.
  static String _dayLabel(String date) {
    final at = Format.parse(date);
    return at == null ? '' : '${at.day}';
  }
}

/// One of the busiest events.
class _TopEvent extends StatelessWidget {
  const new({required this.event});

  final TopEventDto event;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
    child: Row(
      children: [
        Expanded(
          child: Text(
            event.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: AppType.body,
          ),
        ),
        const SizedBox(width: AppSpacing.md),
        Text(
          '${event.clicks}',
          style: AppType.title.copyWith(color: AppColors.accent),
        ),
      ],
    ),
  );
}

/// A section heading in the dashboard.
class _Heading extends StatelessWidget {
  const new(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: AppSpacing.md),
    child: Semantics(header: true, child: Text(text, style: AppType.heading)),
  );
}
