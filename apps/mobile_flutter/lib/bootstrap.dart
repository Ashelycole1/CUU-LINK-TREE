import 'dart:async';
import 'dart:developer' as developer;

import 'package:event_tree/app.dart';
import 'package:event_tree/core/analytics/analytics.dart';
import 'package:event_tree/core/analytics/analytics_events.dart';
import 'package:event_tree/core/analytics/posthog_analytics.dart';
import 'package:event_tree/core/notifications/background_sync.dart';
import 'package:event_tree/core/widgets/friendly_error.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_web_plugins/url_strategy.dart';

/// Where [reportError] sends crashes once analytics is up.
///
/// A plain variable rather than a provider because errors can arrive
/// before — or after — any widget tree exists.
Analytics _analytics = const NoopAnalytics();

/// Starts the app with every error caught (plan §7, rule 1).
///
/// - `FlutterError.onError` gets errors from building, layout and painting.
/// - `PlatformDispatcher.onError` gets uncaught async errors from the engine.
/// - `runZonedGuarded` catches anything else thrown in the app's zone.
/// - Release builds swap Flutter's red error screen for [FriendlyError].
///
/// Analytics and background work both start *after* `runApp`, so
/// neither can hold up the first frame.
Future<void> bootstrap() async {
  await runZonedGuarded<Future<void>>(() async {
    WidgetsFlutterBinding.ensureInitialized();
    installErrorHandlers(release: kReleaseMode);
    // Web only: read `/explore`, `/gdg/...` from the path, as the web app
    // does, instead of Flutter's default `#/` URLs. No-op on Android/iOS.
    usePathUrlStrategy();
    final container = ProviderContainer();
    runApp(
      UncontrolledProviderScope(
        container: container,
        child: const EventTreeApp(),
      ),
    );
    unawaited(startAnalytics(container));
    unawaited(startBackgroundWork());
  }, reportError);
}

/// Brings PostHog up, if this build has a key at all (plan §6).
@visibleForTesting
Future<void> startAnalytics(ProviderContainer container) async {
  try {
    final analytics = container.read(analyticsProvider);
    await analytics.initialize();
    _analytics = analytics;
  } on Exception catch (error, stack) {
    developer.log(
      'Analytics did not start',
      name: 'event_tree',
      error: error,
      stackTrace: stack,
    );
  }
}

/// Registers the periodic follow sync and catches up straight away.
///
/// The OS runs the periodic task every 15 minutes at best, and battery
/// saver can delay it further, so the app also syncs on open: whatever
/// the OS did or did not do, opening the app brings it up to date
/// (plan §5.2). Neither plugin exists on the web, so both are skipped
/// there, and nothing here is allowed to stop the app starting.
@visibleForTesting
Future<void> startBackgroundWork() async {
  if (kIsWeb) return;
  try {
    await registerBackgroundSync();
  } on Exception catch (error, stack) {
    reportError(error, stack);
  }
  try {
    await runFollowSync();
  } on Exception catch (error, stack) {
    reportError(error, stack);
  }
}

/// Routes framework and platform errors to [reportError], and in [release]
/// builds replaces the red error widget with [FriendlyError].
@visibleForTesting
void installErrorHandlers({required bool release}) {
  FlutterError.onError = (details) {
    FlutterError.presentError(details);
    reportError(details.exception, details.stack ?? StackTrace.empty);
  };
  PlatformDispatcher.instance.onError = (error, stack) {
    reportError(error, stack);
    return true;
  };
  if (release) {
    ErrorWidget.builder = (details) => const FriendlyError();
  }
}

/// Records an uncaught error locally and, once analytics is up, as an
/// `app_error` event.
///
/// Only the exception's type and the first line of its message go out:
/// a stack trace or a full message can carry a URL, a username or
/// whatever somebody typed, and plan §6 forbids all of it.
void reportError(Object error, StackTrace stack) {
  developer.log(
    error.runtimeType.toString(),
    name: 'event_tree',
    error: error,
    stackTrace: stack,
  );
  unawaited(
    _analytics.track(
      AnalyticsEvents.appError,
      properties: {
        'type': error.runtimeType.toString(),
        'message': shortErrorMessage(error),
      },
    ),
  );
}

/// The first line of an error, capped, with nothing personal in it.
@visibleForTesting
String shortErrorMessage(Object error) {
  final first = error.toString().split('\n').first.trim();
  return first.length <= 120 ? first : '${first.substring(0, 117)}…';
}
