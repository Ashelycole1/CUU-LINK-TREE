import 'dart:async';

import 'package:event_tree/core/analytics/posthog_analytics.dart';
import 'package:event_tree/core/config/env.dart';
import 'package:event_tree/core/theme/tokens.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// The analytics opt-out at `/app/analytics` (plan §6).
///
/// The switch is worth a screen of its own because the honest version
/// of it needs a paragraph: what is counted, what is never sent, and
/// why it is on by default.
class AnalyticsSettingsScreen extends ConsumerStatefulWidget {
  /// Creates the analytics screen.
  const new({super.key});

  @override
  ConsumerState<AnalyticsSettingsScreen> createState() =>
      _AnalyticsSettingsScreenState();
}

class _AnalyticsSettingsScreenState
    extends ConsumerState<AnalyticsSettingsScreen> {
  bool? _optedOut;

  @override
  void initState() {
    super.initState();
    unawaited(_load());
  }

  Future<void> _load() async {
    final optedOut = await readAnalyticsOptOut();
    if (mounted) setState(() => _optedOut = optedOut);
  }

  Future<void> _set({required bool share}) async {
    setState(() => _optedOut = !share);
    final analytics = ref.read(analyticsProvider);
    if (share) {
      await analytics.optIn();
    } else {
      await analytics.optOut();
    }
  }

  @override
  Widget build(BuildContext context) {
    final optedOut = _optedOut;
    final off = Env.posthogKey.isEmpty;
    return Scaffold(
      appBar: AppBar(title: const Text('Usage analytics')),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: [
            Text(
              off ? 'This build sends nothing' : 'Help us work out what to fix',
              style: AppType.heading,
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              off
                  ? 'No analytics key was built into this copy of the app, '
                        'so nothing leaves your phone whatever this switch '
                        'says.'
                  : 'We count what gets used — which screens are opened, '
                        'how many events are saved — so the next thing we '
                        'build is the thing students actually need.',
              style: AppType.body.copyWith(color: AppColors.textMuted),
            ),
            const SizedBox(height: AppSpacing.xl),
            SwitchListTile.adaptive(
              value: optedOut == false,
              onChanged: optedOut == null || off
                  ? null
                  : (value) => unawaited(_set(share: value)),
              title: const Text('Share anonymous usage'),
              subtitle: const Text('You can turn this off at any time.'),
              contentPadding: EdgeInsets.zero,
            ),
            const SizedBox(height: AppSpacing.xl),
            const _NeverSent(),
          ],
        ),
      ),
    );
  }
}

/// The list that makes the promise concrete.
class _NeverSent extends StatelessWidget {
  const new();

  static const List<String> _items = [
    'Your email address or your name',
    'Anything you type in a review',
    'Photos you upload',
    'Which events you personally saved',
  ];

  @override
  Widget build(BuildContext context) => Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      const Text('Never sent', style: AppType.title),
      const SizedBox(height: AppSpacing.sm),
      for (final item in _items)
        Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.sm),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.only(top: 3),
                child: Icon(
                  LucideIcons.x,
                  size: 14,
                  color: AppColors.textSubtle,
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              Expanded(
                child: Text(
                  item,
                  style: AppType.body.copyWith(color: AppColors.textMuted),
                ),
              ),
            ],
          ),
        ),
    ],
  );
}
