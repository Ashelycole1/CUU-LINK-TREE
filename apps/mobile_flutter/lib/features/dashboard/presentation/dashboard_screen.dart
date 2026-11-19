import 'package:event_tree/core/widgets/placeholder_view.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// The Dashboard tab at `/admin`, the same path as the web dashboard.
///
/// For hosts: their events, appearance and analytics. Built in phase 6.
class DashboardScreen extends StatelessWidget {
  /// Creates the Dashboard tab.
  const new({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: PlaceholderView(
        title: 'Dashboard',
        icon: LucideIcons.layoutDashboard,
        heading: 'Your events',
        message:
            'Hosts will add, edit, hide and reorder events here, and see '
            'how many people viewed and clicked them.',
      ),
    );
  }
}
