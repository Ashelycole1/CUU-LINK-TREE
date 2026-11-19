import 'package:event_tree/core/widgets/placeholder_view.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// A host's public page at `/:username`, the same URL as on the web.
///
/// Rendered in the host's own theme in phase 2.
class HostPageScreen extends StatelessWidget {
  /// Creates the page for [username].
  const new({required this.username, super.key});

  /// The host's username, from the URL.
  final String username;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: PlaceholderView(
        title: '@$username',
        icon: LucideIcons.calendarDays,
        heading: 'Upcoming and past events',
        message: 'This host page, in its own colours, comes in phase 2.',
      ),
    );
  }
}
