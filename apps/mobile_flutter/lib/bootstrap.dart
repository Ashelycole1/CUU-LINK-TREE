import 'dart:async';
import 'dart:developer' as developer;

import 'package:event_tree/app.dart';
import 'package:event_tree/core/widgets/friendly_error.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_web_plugins/url_strategy.dart';

/// Starts the app with every error caught (plan §7, rule 1).
///
/// - `FlutterError.onError` gets errors from building, layout and painting.
/// - `PlatformDispatcher.onError` gets uncaught async errors from the engine.
/// - `runZonedGuarded` catches anything else thrown in the app's zone.
/// - Release builds swap Flutter's red error screen for [FriendlyError].
///
/// Later phases add PostHog, notifications, time zones and workmanager here.
Future<void> bootstrap() async {
  await runZonedGuarded<Future<void>>(() async {
    WidgetsFlutterBinding.ensureInitialized();
    installErrorHandlers(release: kReleaseMode);
    // Web only: read `/explore`, `/gdg/...` from the path, as the web app
    // does, instead of Flutter's default `#/` URLs. No-op on Android/iOS.
    usePathUrlStrategy();
    runApp(const ProviderScope(child: EventTreeApp()));
  }, reportError);
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

/// Records an uncaught error. Phase 7 also sends an `app_error` event
/// (type and a short message, no personal data) to Analytics (plan §6).
void reportError(Object error, StackTrace stack) {
  developer.log(
    error.runtimeType.toString(),
    name: 'event_tree',
    error: error,
    stackTrace: stack,
  );
}
