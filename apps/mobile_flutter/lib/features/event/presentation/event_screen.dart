import 'package:event_tree/core/widgets/placeholder_view.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// One event at `/:username/:slug`, the same URL as on the web.
///
/// Built in phase 2.
class EventScreen extends StatelessWidget {
  /// Creates the screen for the event [slug] on [username]'s page.
  const new({required this.username, required this.slug, super.key});

  /// The host's username, from the URL.
  final String username;

  /// The event's slug, from the URL.
  final String slug;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: PlaceholderView(
        title: slug,
        icon: LucideIcons.ticket,
        heading: 'Event details',
        message: 'Time, venue, links, reminders and photos from @$username.',
      ),
    );
  }
}
