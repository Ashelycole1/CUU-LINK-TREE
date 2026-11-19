import 'dart:async';

import 'package:event_tree/core/router/app_router.dart';
import 'package:event_tree/core/theme/tokens.dart';
import 'package:event_tree/core/widgets/async_view.dart';
import 'package:event_tree/core/widgets/event_row.dart';
import 'package:event_tree/data/models/community.dart';
import 'package:event_tree/features/discover/application/discover_providers.dart';
import 'package:event_tree/features/discover/presentation/widgets/category_chips.dart';
import 'package:event_tree/features/discover/presentation/widgets/discover_search_field.dart';
import 'package:event_tree/features/discover/presentation/widgets/discover_skeleton.dart';
import 'package:event_tree/features/discover/presentation/widgets/host_rail.dart';
import 'package:event_tree/features/discover/presentation/widgets/week_card.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// The Discover tab at `/explore`: upcoming events from every host.
///
/// The app's answer to the web Community page, laid out for a phone:
/// search and category chips, a "This week" carousel, every upcoming
/// event as a list, and the hosts themselves at the bottom.
class DiscoverScreen extends ConsumerWidget {
  /// Creates the Discover tab.
  const new({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feed = ref.watch(communityProvider);
    final filters = ref.watch(discoverFiltersProvider);
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: RefreshIndicator(
          onRefresh: () async {
            // The value is not needed here; the provider rebuilds the
            // list. `unawaited` would hide the spinner, so it is awaited
            // and the result deliberately dropped.
            final _ = await ref.refresh(communityProvider.future);
          },
          child: AsyncView<CommunityDto>(
            value: feed,
            onRetry: () => ref.invalidate(communityProvider),
            loading: const DiscoverSkeleton(),
            data: (community) => _Feed(community: community, filters: filters),
          ),
        ),
      ),
    );
  }
}

/// The loaded feed.
class _Feed extends ConsumerWidget {
  const new({required this.community, required this.filters});

  final CommunityDto community;
  final CommunityQuery filters;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notifier = ref.read(discoverFiltersProvider.notifier);
    final week = eventsThisWeek(community);
    final hasEvents = community.events.isNotEmpty;
    return ListView(
      padding: const EdgeInsets.only(bottom: AppSpacing.xxl),
      children: [
        const _Gutter(
          child: Padding(
            padding: EdgeInsets.only(top: AppSpacing.lg, bottom: AppSpacing.lg),
            child: _Title(),
          ),
        ),
        _Gutter(
          child: DiscoverSearchField(
            initialText: filters.q,
            onSearch: notifier.search,
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        CategoryChips(
          categories: community.categories,
          selected: filters.category,
          onSelected: notifier.chooseCategory,
        ),
        if (!hasEvents)
          _NothingFound(filtered: !filters.isEmpty, onClear: notifier.clear)
        else ...[
          if (week.isNotEmpty && filters.isEmpty) ...[
            const _SectionHeading('This week'),
            _WeekRail(entries: week),
          ],
          _SectionHeading(filters.isEmpty ? 'All upcoming' : 'Results'),
          for (final entry in community.events)
            _Gutter(
              child: EventRow(
                event: entry.event,
                hostUsername: entry.host.username,
                hostAvatarUrl: entry.host.avatarUrl,
                onTap: () => unawaited(
                  context.push(
                    AppRoutes.event(entry.host.username, entry.event.slug),
                  ),
                ),
              ),
            ),
        ],
        if (community.pages.isNotEmpty) ...[
          const _SectionHeading('Hosts'),
          HostRail(
            pages: community.pages,
            onOpen: (username) =>
                unawaited(context.push(AppRoutes.page(username))),
          ),
        ],
      ],
    );
  }
}

/// The screen title and the site-wide count under it.
class _Title extends StatelessWidget {
  const new();

  @override
  Widget build(BuildContext context) => Semantics(
    header: true,
    child: const Text('Discover', style: AppType.display),
  );
}

/// A section heading with the gutter and spacing above it.
class _SectionHeading extends StatelessWidget {
  const new(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(
      AppSpacing.lg,
      AppSpacing.xl,
      AppSpacing.lg,
      AppSpacing.md,
    ),
    child: Semantics(header: true, child: Text(text, style: AppType.heading)),
  );
}

/// The horizontal "This week" carousel.
class _WeekRail extends StatelessWidget {
  const new({required this.entries});

  final List<CommunityEventDto> entries;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: 170,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        itemCount: entries.length,
        separatorBuilder: (context, _) => const SizedBox(width: AppSpacing.md),
        itemBuilder: (context, index) {
          final entry = entries[index];
          return WeekCard(
            event: entry.event,
            onTap: () => unawaited(
              context.push(
                AppRoutes.event(entry.host.username, entry.event.slug),
              ),
            ),
          );
        },
      ),
    );
  }
}

/// Nothing matched, either because the campus is quiet or because the
/// filters are too narrow.
class _NothingFound extends StatelessWidget {
  const new({required this.filtered, required this.onClear});

  final bool filtered;
  final VoidCallback onClear;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: AppSpacing.xxl),
    child: EmptyState(
      icon: LucideIcons.calendarSearch,
      heading: filtered ? 'Nothing matches' : 'No events yet',
      message: filtered
          ? 'Try another category, or clear the search.'
          : 'When a club or faculty posts an event, it shows up here.',
      action: filtered
          ? OutlinedButton(onPressed: onClear, child: const Text('Clear'))
          : null,
    ),
  );
}

/// The screen gutter, so every block lines up.
class _Gutter extends StatelessWidget {
  const new({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
    child: child,
  );
}
