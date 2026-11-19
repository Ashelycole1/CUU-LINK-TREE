import 'package:event_tree/core/widgets/placeholder_view.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// The Saved tab at `/app/saved`: saved events and their reminders.
///
/// App-only (the web has no saved list). Built in phase 3.
class SavedScreen extends StatelessWidget {
  /// Creates the Saved tab.
  const new({super.key});

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: PlaceholderView(
        title: 'Saved',
        icon: LucideIcons.bookmark,
        heading: 'Nothing saved yet',
        message:
            'Save an event and you will get a reminder the day before '
            'and an hour before it starts.',
      ),
    );
  }
}
