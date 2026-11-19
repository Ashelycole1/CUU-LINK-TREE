import 'package:event_tree/core/analytics/analytics.dart';
import 'package:event_tree/core/config/env.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:posthog_flutter/posthog_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// PostHog on the free tier, sharing one project with the web app.
///
/// Session replay stays **off** (plan §6): the mobile replay allowance
/// is small, and recording students' screens is not something to turn
/// on without asking. Nothing is sent at all when the build carries no
/// `POSTHOG_KEY`, which is every developer build by default.
class PostHogAnalytics implements Analytics {
  /// Creates the service. Nothing is sent until [initialize].
  new({Posthog? client}) : _client = client ?? Posthog();

  /// Where the opt-out is remembered.
  static const String optOutKey = 'analytics_opt_out_v1';

  final Posthog _client;
  bool _ready = false;
  bool _optedOut = false;

  @override
  Future<void> initialize() async {
    if (_ready || Env.posthogKey.isEmpty) return;
    final config = PostHogConfig(Env.posthogKey)
      ..host = Env.posthogHost
      ..debug = kDebugMode
      // Replay off to start (plan §6). Turning it on needs the owner's
      // say-so and text masking.
      ..sessionReplay = false
      ..captureApplicationLifecycleEvents = true;
    await _client.setup(config);
    _ready = true;
    final prefs = await SharedPreferences.getInstance();
    if (prefs.getBool(optOutKey) ?? false) await optOut();
  }

  @override
  Future<void> track(String event, {Map<String, Object>? properties}) async {
    if (!_canSend) return;
    await _client.capture(eventName: event, properties: properties);
  }

  @override
  Future<void> screen(String name, {Map<String, Object>? properties}) async {
    if (!_canSend) return;
    await _client.screen(screenName: name, properties: properties);
  }

  @override
  Future<void> identify(String userId) async {
    if (!_canSend || userId.isEmpty) return;
    // Only the id. Emails and names are forbidden here (plan §6).
    await _client.identify(userId: userId);
  }

  @override
  Future<void> reset() async {
    if (!_ready) return;
    await _client.reset();
  }

  @override
  Future<void> optOut() async {
    _optedOut = true;
    await _remember(true);
    if (_ready) await _client.optOut();
  }

  @override
  Future<void> optIn() async {
    _optedOut = false;
    await _remember(false);
    if (_ready) await _client.optIn();
  }

  bool get _canSend => _ready && !_optedOut;

  Future<void> _remember(bool optedOut) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(optOutKey, optedOut);
  }
}

/// Whether this phone has opted out of analytics.
Future<bool> readAnalyticsOptOut() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getBool(PostHogAnalytics.optOutKey) ?? false;
}

/// The app's one analytics service.
///
/// A build with no `POSTHOG_KEY` gets [NoopAnalytics], so nothing is
/// sent and nothing has to be guarded at the call site.
final analyticsProvider = Provider<Analytics>(
  (ref) => Env.posthogKey.isEmpty ? const NoopAnalytics() : PostHogAnalytics(),
);
