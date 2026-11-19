import 'dart:async';

import 'package:event_tree/core/router/app_router.dart';
import 'package:event_tree/core/theme/tokens.dart';
import 'package:event_tree/core/widgets/async_view.dart';
import 'package:event_tree/data/models/saved_event.dart';
import 'package:event_tree/data/providers/saved_providers.dart';
import 'package:event_tree/features/saved/presentation/widgets/saved_event_row.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// The Saved tab at `/app/saved`: what this phone has kept.
///
/// Everything here is read from the phone, so it works with no
/// connection — which is the point of saving an event in the first
/// place. Saved events that are still ahead have reminders set for a
/// day and an hour before (plan §5.1).
class SavedScreen extends ConsumerWidget {
  /// Creates the Saved tab.
  const new({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final saved = ref.watch(savedProvider);
    return Scaffold(
      body: SafeArea(
        bottom: false,
        child: AsyncView<SavedState>(
          value: saved,
          onRetry: () => ref.invalidate(savedProvider),
          data: (state) =>
              state.isEmpty ? const _NothingSaved() : _SavedList(state: state),
        ),
      ),
    );
  }
}

/// The loaded list: upcoming, then followed hosts, then what is over.
class _SavedList extends ConsumerWidget {
  const new({required this.state});

  final SavedState state;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final controller = ref.read(savedProvider.notifier);
    final upcoming = state.upcoming;
    final past = state.past;
    return ListView(
      padding: const EdgeInsets.only(bottom: AppSpacing.xxl),
      children: [
        const _Gutter(
          child: Padding(
            padding: EdgeInsets.symmetric(vertical: AppSpacing.lg),
            child: _Title(),
          ),
        ),
        if (upcoming.isNotEmpty) ...[
          const _Heading('Coming up'),
          const _ReminderNote(),
          for (final event in upcoming)
            _Gutter(
              child: SavedEventRow(
                event: event,
                onOpen: () => unawaited(_open(context, event)),
                onRemove: () => unawaited(controller.forget(event.id)),
              ),
            ),
        ],
        if (state.following.isNotEmpty) ...[
          const _Heading('Following'),
          for (final username in state.following)
            _Gutter(
              child: _FollowedHost(
                username: username,
                onOpen: () => unawaited(context.push(AppRoutes.page(username))),
                onUnfollow: () => unawaited(controller.toggleFollow(username)),
              ),
            ),
        ],
        if (past.isNotEmpty) ...[
          const _Heading('Been and gone'),
          for (final event in past)
            _Gutter(
              child: Opacity(
                opacity: 0.78,
                child: SavedEventRow(
                  event: event,
                  onOpen: () => unawaited(_open(context, event)),
                  onRemove: () => unawaited(controller.forget(event.id)),
                ),
              ),
            ),
        ],
      ],
    );
  }

  Future<void> _open(BuildContext context, SavedEvent event) =>
      context.push(AppRoutes.event(event.username, event.slug));
}

/// The screen title.
class _Title extends StatelessWidget {
  const new();

  @override
  Widget build(BuildContext context) => Semantics(
    header: true,
    child: const Text('Saved', style: AppType.display),
  );
}

/// A section heading.
class _Heading extends StatelessWidget {
  const new(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(
      AppSpacing.lg,
      AppSpacing.xl,
      AppSpacing.lg,
      AppSpacing.md,
    ),
    child: Semantics(header: true, child: Text(text, style: AppType.heading)),
  );
}

/// Says plainly what saving an event buys you.
class _ReminderNote extends StatelessWidget {
  const new();

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.fromLTRB(
      AppSpacing.lg,
      0,
      AppSpacing.lg,
      AppSpacing.md,
    ),
    child: Row(
      children: [
        const Icon(LucideIcons.bell, size: 15, color: AppColors.textSubtle),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Text(
            'Reminders a day and an hour before each one.',
            style: AppType.caption.copyWith(color: AppColors.textSubtle),
          ),
        ),
      ],
    ),
  );
}

/// One followed host.
class _FollowedHost extends StatelessWidget {
  const new({
    required this.username,
    required this.onOpen,
    required this.onUnfollow,
  });

  final String username;
  final VoidCallback onOpen;
  final VoidCallback onUnfollow;

  @override
  Widget build(BuildContext context) => InkWell(
    onTap: onOpen,
    borderRadius: BorderRadius.circular(AppRadii.md),
    child: Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Row(
        children: [
          const Icon(LucideIcons.atSign, size: 18, color: AppColors.textSubtle),
          const SizedBox(width: AppSpacing.sm),
          Expanded(child: Text(username, style: AppType.title)),
          TextButton(onPressed: onUnfollow, child: const Text('Unfollow')),
        ],
      ),
    ),
  );
}

/// Nothing saved and nobody followed yet.
class _NothingSaved extends StatelessWidget {
  const new();

  @override
  Widget build(BuildContext context) => const Column(
    children: [
      _Gutter(
        child: Padding(
          padding: EdgeInsets.symmetric(vertical: AppSpacing.lg),
          child: _Title(),
        ),
      ),
      Expanded(
        child: EmptyState(
          icon: LucideIcons.bookmark,
          heading: 'Nothing saved yet',
          message:
              'Save an event and this phone will remind you a day and an '
              'hour before it starts, even with no data. Follow a host to '
              'hear when they post something new.',
        ),
      ),
    ],
  );
}

/// The screen gutter, so every block lines up.
class _Gutter extends StatelessWidget {
  const new({required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
    child: child,
  );
}
