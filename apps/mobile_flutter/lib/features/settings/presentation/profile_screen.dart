import 'package:event_tree/core/config/env.dart';
import 'package:event_tree/core/widgets/placeholder_view.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// The Profile tab at `/app/profile`: account, notifications and settings.
///
/// App-only. Sign-in arrives in phase 4, settings in phases 3 and 7.
class ProfileScreen extends StatelessWidget {
  /// Creates the Profile tab.
  const new({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PlaceholderView(
        title: 'Profile',
        icon: LucideIcons.circleUser,
        heading: 'Your account',
        message:
            'Sign in with the same account you use on the web, choose '
            'your notifications and manage your page.',
        footer: Env.hasApiBaseUrl
            ? 'Server: ${Env.apiBaseUrl}'
            : 'Server: not set (build with --dart-define=API_BASE_URL)',
      ),
    );
  }
}
