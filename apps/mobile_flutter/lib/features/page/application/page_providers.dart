import 'package:event_tree/core/network/api_error.dart';
import 'package:event_tree/data/repositories/pages_repository.dart';

/// Counts one visit to [username]'s page for the host's own dashboard.
///
/// This is the in-house counter hosts see, not PostHog (plan §6). It is
/// best-effort: a missed count is never worth an error screen. The page
/// itself is read through `hostPageProvider` in `data/providers`.
Future<void> recordPageVisit(
  PagesRepository repository,
  String username,
) async {
  try {
    await repository.recordView(username);
  } on ApiError {
    return;
  }
}
