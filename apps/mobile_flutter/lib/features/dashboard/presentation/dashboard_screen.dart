import 'dart:async';

import 'package:event_tree/core/router/app_router.dart';
import 'package:event_tree/core/theme/tokens.dart';
import 'package:event_tree/core/widgets/async_view.dart';
import 'package:event_tree/data/providers/auth_providers.dart';
import 'package:event_tree/features/dashboard/presentation/widgets/analytics_panel.dart';
import 'package:event_tree/features/dashboard/presentation/widgets/appearance_editor.dart';
import 'package:event_tree/features/dashboard/presentation/widgets/my_events_list.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// Which part of the dashboard is showing.
enum DashboardSection {
  /// The host's events.
  events('Events'),

  /// The page's colours, buttons and font.
  look('Look'),

  /// Views and clicks.
  numbers('Numbers');

  new(this.label);

  /// What the tab says.
  final String label;
}

/// The host Dashboard at `/admin`, the same path the web app uses.
///
/// Three parts, as on the web: the events, how the page looks, and
/// what it is doing. Anyone not signed in sees why they might want to
/// be, rather than a log-in wall with no explanation.
class DashboardScreen extends ConsumerStatefulWidget {
  /// Creates the Dashboard tab.
  const new({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  DashboardSection _section = DashboardSection.events;

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: AsyncView<AuthState>(
          value: auth,
          onRetry: () => ref.invalidate(authProvider),
          data: (state) {
            if (!state.isSignedIn) return const _NotAHost();
            if (state.needsUsername) return const _NoPageYet();
            return _Dashboard(
              username: state.username,
              section: _section,
              onSection: (section) => setState(() => _section = section),
            );
          },
        ),
      ),
    );
  }
}

/// The dashboard proper.
class _Dashboard extends StatelessWidget {
  const new({
    required this.username,
    required this.section,
    required this.onSection,
  });

  final String username;
  final DashboardSection section;
  final ValueChanged<DashboardSection> onSection;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.lg,
            AppSpacing.lg,
            AppSpacing.sm,
          ),
          child: Row(
            children: [
              Expanded(
                child: Semantics(
                  header: true,
                  child: const Text('Dashboard', style: AppType.display),
                ),
              ),
              IconButton(
                tooltip: 'View my page',
                onPressed: () =>
                    unawaited(context.push(AppRoutes.page(username))),
                icon: const Icon(LucideIcons.externalLink),
              ),
            ],
          ),
        ),
        Padding(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            0,
            AppSpacing.lg,
            AppSpacing.md,
          ),
          child: Text(
            '@$username',
            style: AppType.body.copyWith(color: AppColors.textMuted),
          ),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          child: SegmentedButton<DashboardSection>(
            segments: [
              for (final value in DashboardSection.values)
                ButtonSegment<DashboardSection>(
                  value: value,
                  label: Text(value.label),
                ),
            ],
            selected: {section},
            showSelectedIcon: false,
            onSelectionChanged: (selection) => onSection(selection.first),
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        Expanded(
          child: switch (section) {
            DashboardSection.events => const MyEventsList(),
            DashboardSection.look => const AppearanceEditor(),
            DashboardSection.numbers => const AnalyticsPanel(),
          },
        ),
      ],
    );
  }
}

/// Nobody is signed in.
class _NotAHost extends StatelessWidget {
  const new();

  @override
  Widget build(BuildContext context) => EmptyState(
    icon: LucideIcons.layoutDashboard,
    heading: 'For hosts',
    message:
        'This is where a club, faculty or the guild posts events and '
        'sees how many people looked. Finding and saving events needs '
        'no account.',
    action: FilledButton(
      onPressed: () => context.go(AppRoutes.signIn),
      child: const Text('Log in'),
    ),
  );
}

/// Signed in, but no handle claimed yet, so there is no page.
class _NoPageYet extends StatelessWidget {
  const new();

  @override
  Widget build(BuildContext context) => EmptyState(
    icon: LucideIcons.atSign,
    heading: 'Pick a handle first',
    message:
        'Your handle becomes your page address. Nothing can be '
        'posted until there is a page to post it on.',
    action: FilledButton(
      onPressed: () => context.go(AppRoutes.claimUsername),
      child: const Text('Pick a handle'),
    ),
  );
}
