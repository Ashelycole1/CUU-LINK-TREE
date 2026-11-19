import 'package:event_tree/core/widgets/placeholder_view.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// Shown for a link the app does not know.
class NotFoundScreen extends StatelessWidget {
  /// Creates the not-found screen.
  const new({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(),
      body: const PlaceholderView(
        title: 'Not found',
        icon: LucideIcons.searchX,
        heading: 'This link goes nowhere',
        message: 'The page may have moved or been removed.',
      ),
    );
  }
}
