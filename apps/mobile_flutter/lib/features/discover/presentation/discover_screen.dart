import 'package:event_tree/core/widgets/placeholder_view.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// The Discover tab at `/explore`: upcoming events from every host.
///
/// Mirrors the web's Community page. The feed arrives in phase 2.
class DiscoverScreen extends StatelessWidget {
  /// Creates the Discover tab.
  const new({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: PlaceholderView(
        title: 'Discover',
        icon: LucideIcons.compass,
        heading: 'Events from every host',
        message:
            'Talks, matches, concerts and workshops happening around '
            'campus will show here, soonest first.',
      ),
    );
  }
}
