import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// The bottom navigation: Discover, Saved, Dashboard and Profile.
///
/// Each tab keeps its own navigation stack (go_router's indexed stack).
/// Dashboard shows only for hosts once accounts land (phase 4).
class AppShell extends StatelessWidget {
  /// Wraps the tab branches in [navigationShell].
  const new({required this.navigationShell, super.key});

  /// The tab branches, from `StatefulShellRoute.indexedStack`.
  final StatefulNavigationShell navigationShell;

  void _select(int index) {
    // Tapping the current tab goes back to that tab's first screen.
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: NavigationBar(
        selectedIndex: navigationShell.currentIndex,
        onDestinationSelected: _select,
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
