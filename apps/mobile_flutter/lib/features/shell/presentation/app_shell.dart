import 'package:event_tree/core/analytics/analytics_observer.dart';
import 'package:event_tree/core/analytics/posthog_analytics.dart';
import 'package:event_tree/core/router/app_router.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// The bottom navigation: Discover, Saved, Dashboard and Profile.
///
/// Each tab keeps its own navigation stack (go_router's indexed stack).
/// Dashboard stays visible for everyone: it explains what hosting is
/// rather than hiding behind a log-in.
class AppShell extends ConsumerWidget {
  /// Wraps the tab branches in [navigationShell].
  const new({required this.navigationShell, super.key});

  /// The tab branches, from `StatefulShellRoute.indexedStack`.
  final StatefulNavigationShell navigationShell;

  static const List<String> _tabLocations = [
    AppRoutes.discover,
    AppRoutes.saved,
    AppRoutes.dashboard,
    AppRoutes.profile,
  ];

  void _select(WidgetRef ref, int index) {
    // Switching tabs does not push a route, so the observer never sees
    // it; the shell reports the screen itself (plan §6).
    reportScreen(ref.read(analyticsProvider), _tabLocations[index]);
    // Tapping the current tab goes back to that tab's first screen.
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: (index) => _select(ref, index),
        destinations: const [
          NavigationDestination(
            icon: Icon(LucideIcons.compass),
            label: 'Discover',
          ),
          NavigationDestination(
            icon: Icon(LucideIcons.bookmark),
            label: 'Saved',
          ),
          NavigationDestination(
            icon: Icon(LucideIcons.layoutDashboard),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(LucideIcons.circleUser),
            label: 'Profile',
          ),
        ],
      ),
    );
  }
}
