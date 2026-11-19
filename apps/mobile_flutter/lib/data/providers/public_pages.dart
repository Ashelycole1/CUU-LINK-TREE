/// The public page and event reads, as providers.
///
/// They live in `data/` rather than in one feature because two features
/// need them: the page screen renders a page, and the event screen reads
/// the same page for the host's colours (the web event page does exactly
/// this). Sharing the provider means opening an event from a host's page
/// costs no second request.
library;

import 'package:event_tree/data/models/event.dart';
import 'package:event_tree/data/models/tree.dart';
import 'package:event_tree/data/repositories/pages_repository.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

/// A host's whole public page, by username.
///
/// Reading a page does not count a visit; `recordPageVisit` does that,
/// once, from the page screen.
// The type is `FutureProviderFamily`, which flutter_riverpod 3 does not
// export, so it cannot be written down here.
// ignore: specify_nonobvious_property_types
final hostPageProvider = FutureProvider.family<TreeDto, String>(
  (ref, username) => ref.watch(pagesRepositoryProvider).getPage(username),
);

/// Which event to show: the host's handle and the event's slug, the same
/// two parts the web URL carries.
typedef EventKey = ({String username, String slug});

/// One event on a host's page.
// ignore: specify_nonobvious_property_types
final pageEventProvider = FutureProvider.family<EventDto, EventKey>(
  (ref, key) =>
      ref.watch(pagesRepositoryProvider).getPageEvent(key.username, key.slug),
);
