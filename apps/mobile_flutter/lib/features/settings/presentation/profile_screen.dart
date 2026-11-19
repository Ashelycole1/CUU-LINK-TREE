import 'dart:async';

import 'package:event_tree/core/router/app_router.dart';
import 'package:event_tree/core/theme/tokens.dart';
import 'package:event_tree/core/widgets/async_view.dart';
import 'package:event_tree/data/providers/auth_providers.dart';
import 'package:event_tree/features/settings/presentation/widgets/settings_tile.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// The Profile tab at `/app/profile`: the account, and the switches.
///
/// Students never need an account, so this screen leads with what the
/// app does for them and offers hosting as a second thing, rather than
/// opening with a log-in wall.
class ProfileScreen extends ConsumerWidget {
  /// Creates the Profile tab.
  const new({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: AsyncView<AuthState>(
          value: auth,
          onRetry: () => ref.invalidate(authProvider),
          data: (state) => ListView(
            padding: const EdgeInsets.only(bottom: AppSpacing.xxl),
            children: [
              const Padding(
                padding: EdgeInsets.fromLTRB(
                  AppSpacing.lg,
                  AppSpacing.lg,
                  AppSpacing.lg,
                  AppSpacing.lg,
                ),
                child: _Title(),
              ),
              if (state.isSignedIn)
                _Account(state: state)
              else
                const _SignedOut(),
              const _SectionHeading('Settings'),
              const SettingsTile(
                icon: LucideIcons.bell,
                title: 'Notifications',
                subtitle:
                    'Reminders for saved events and new events from hosts '
                    'you follow. Change them in your phone settings.',
              ),
              SettingsTile(
                icon: LucideIcons.chartNoAxesColumn,
                title: 'Usage analytics',
                subtitle:
                    'Anonymous counts that tell us what to fix next. '
                    'No emails, names or review text ever leave the phone.',
                onTap: () =>
                    unawaited(context.push(AppRoutes.analyticsSettings)),
              ),
              const _SectionHeading('About'),
              const SettingsTile(
                icon: LucideIcons.info,
                title: 'Event Tree',
                subtitle:
                    'Events at Cavendish University Uganda, in one place. '
                    'Built by students, for students.',
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// The signed-in host: who they are and what they can do.
class _Account extends ConsumerWidget {
  const new({required this.state});

  final AuthState state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
          child: Card(
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    state.username.isEmpty
                        ? 'No page yet'
                        : '@${state.username}',
                    style: AppType.heading,
                  ),
                  const SizedBox(height: 2),
                  Text(
                    state.email,
                    style: AppType.body.copyWith(color: AppColors.textMuted),
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  if (state.needsUsername)
                    FilledButton(
                      onPressed: () => context.go(AppRoutes.claimUsername),
                      child: const Text('Pick a handle'),
                    )
                  else
                    Row(
                      children: [
                        Expanded(
                          child: FilledButton(
                            onPressed: () => context.go(AppRoutes.dashboard),
                            child: const Text('My events'),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => unawaited(
                              context.push(AppRoutes.page(state.username)),
                            ),
                            child: const Text('View page'),
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),
          ),
        ),
        const SizedBox(height: AppSpacing.md),
        SettingsTile(
          icon: LucideIcons.logOut,
          title: 'Log out',
          subtitle: 'Saved events and follows stay on this phone.',
          onTap: () => unawaited(_signOut(context, ref)),
        ),
      ],
    );
  }

  Future<void> _signOut(BuildContext context, WidgetRef ref) async {
    final messenger = ScaffoldMessenger.of(context);
    await ref.read(authProvider.notifier).signOut();
    messenger
      ..clearSnackBars()
      ..showSnackBar(const SnackBar(content: Text('Logged out.')));
  }
}

/// Nobody is signed in: say what the app already does, then offer
/// hosting.
class _SignedOut extends StatelessWidget {
  const new();

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
    child: Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Running something?', style: AppType.heading),
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Finding events, saving them and getting reminders needs no '
              'account. Create one only if you want a page of your own to '
              'post events on.',
              style: AppType.body.copyWith(color: AppColors.textMuted),
            ),
            const SizedBox(height: AppSpacing.lg),
            Row(
              children: [
                Expanded(
                  child: FilledButton(
                    onPressed: () => context.go(AppRoutes.signUp),
                    child: const Text('Create a page'),
                  ),
                ),
                const SizedBox(width: AppSpacing.md),
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => context.go(AppRoutes.signIn),
                    child: const Text('Log in'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    ),
  );
}

/// The screen title.
class _Title extends StatelessWidget {
  const new();

  @override
  Widget build(BuildContext context) => Semantics(
    header: true,
    child: const Text('Profile', style: AppType.display),
  );
}

/// A section heading.
class _SectionHeading extends StatelessWidget {
  const new(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(
      AppSpacing.lg,
      AppSpacing.xl,
      AppSpacing.lg,
      AppSpacing.sm,
    ),
    child: Semantics(header: true, child: Text(text, style: AppType.heading)),
  );
}
