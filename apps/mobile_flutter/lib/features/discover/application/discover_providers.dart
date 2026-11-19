import 'package:event_tree/data/models/community.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:event_tree/data/repositories/pages_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// The category and search box the Discover tab is filtering by.
///
/// Kept apart from the feed itself so changing a chip re-runs the
/// request without the screen holding any state of its own.
class DiscoverFilters extends Notifier<CommunityQuery> {
  @override
  CommunityQuery build() => const CommunityQuery();

  /// Filters by [category], or shows everything when it is empty.
  void chooseCategory(String category) =>
      state = state.copyWith(category: category);

  /// Sets the search text. Empty text clears the search.
  void search(String text) => state = state.copyWith(q: text.trim());

  /// Goes back to the plain, unfiltered feed.
  void clear() => state = const CommunityQuery();
}

/// What the Discover tab is filtering by right now.
final discoverFiltersProvider =
    NotifierProvider<DiscoverFilters, CommunityQuery>(DiscoverFilters.new);

/// Upcoming events from every host, for the current filters.
final communityProvider = FutureProvider<CommunityDto>((ref) {
  final filters = ref.watch(discoverFiltersProvider);
  return ref.watch(pagesRepositoryProvider).getCommunity(filters);
});

/// The events starting within the next seven days, soonest first.
///
/// The server already sorts the feed, so this only takes the head of it.
/// Anything happening right now counts as this week.
List<CommunityEventDto> eventsThisWeek(
  CommunityDto community, {
  DateTime? now,
}) {
  final from = now ?? DateTime.now();
  final until = from.add(const Duration(days: 7));
  return [
    for (final entry in community.events)
      if (_startsBefore(entry.event, until)) entry,
  ];
}

bool _startsBefore(EventDto event, DateTime until) {
  if (event.status == EventStatus.live) return true;
  final start = event.startsAtLocal;
  return start != null && start.isBefore(until);
}
