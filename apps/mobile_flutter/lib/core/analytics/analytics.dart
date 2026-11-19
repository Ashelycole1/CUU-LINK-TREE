/// Product analytics, as the rest of the app sees it.
///
/// Keeping PostHog behind this interface means no screen imports the
/// SDK, the whole thing can be turned off with one provider, and tests
/// can assert on what would have been sent.
///
/// The rule from plan §6 holds at this boundary: **never pass an email,
/// a name or review text**. Properties are counts, statuses and kinds.
abstract interface class Analytics {
  /// Prepares the SDK. Safe to call more than once; does nothing when
  /// no project key was built in.
  Future<void> initialize();

  /// Records that something happened.
  Future<void> track(String event, {Map<String, Object>? properties});

  /// Records that a screen was opened.
  Future<void> screen(String name, {Map<String, Object>? properties});

  /// Ties what follows to a signed-in host, by id only.
  Future<void> identify(String userId);

  /// Forgets who it was, on sign-out.
  Future<void> reset();

  /// Stops sending anything, for the Settings switch.
  Future<void> optOut();

  /// Starts sending again.
  Future<void> optIn();
}

/// An [Analytics] that does nothing.
///
/// Used in tests, on builds with no project key, and whenever someone
/// has opted out, so callers never have to check first.
class NoopAnalytics implements Analytics {
  /// Creates the do-nothing analytics.
  const new();

  @override
  Future<void> initialize() async {}

  @override
  Future<void> track(String event, {Map<String, Object>? properties}) async {}

  @override
  Future<void> screen(String name, {Map<String, Object>? properties}) async {}

  @override
  Future<void> identify(String userId) async {}

  @override
  Future<void> reset() async {}

  @override
  Future<void> optOut() async {}

  @override
  Future<void> optIn() async {}
}
