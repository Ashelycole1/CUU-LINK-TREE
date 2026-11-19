import 'dart:async';

import 'package:event_tree/core/analytics/analytics.dart';
import 'package:event_tree/core/analytics/analytics_events.dart';
import 'package:event_tree/core/analytics/screen_names.dart';
import 'package:flutter/widgets.dart';

/// Reports `page_viewed` whenever a screen is pushed or comes back.
///
/// The name is the screen, never the location: see [screenNameFor].
/// Tab switches do not push a route, so the shell reports those itself
/// through [reportScreen].
class AnalyticsRouteObserver extends NavigatorObserver {
  /// Reports through [analytics].
  new(this.analytics);

  /// Where the events go.
  final Analytics analytics;

  @override
  void didPush(Route<dynamic> route, Route<dynamic>? previousRoute) {
    super.didPush(route, previousRoute);
    _report(route);
  }

  @override
  void didPop(Route<dynamic> route, Route<dynamic>? previousRoute) {
    super.didPop(route, previousRoute);
    _report(previousRoute);
  }

  void _report(Route<dynamic>? route) {
    final name = route?.settings.name;
    if (name == null || name.isEmpty) return;
    reportScreen(analytics, name);
  }
}

/// Reports one screen view for [location].
void reportScreen(Analytics analytics, String location) {
  final screen = screenNameFor(location);
  unawaited(
    analytics.track(AnalyticsEvents.pageViewed, properties: {'screen': screen}),
  );
  unawaited(analytics.screen(screen));
}
