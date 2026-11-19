import 'dart:async';

import 'package:event_tree/core/network/api_error.dart';
import 'package:event_tree/core/theme/tokens.dart';
import 'package:event_tree/core/widgets/async_view.dart';
import 'package:event_tree/core/widgets/category_icon.dart';
import 'package:event_tree/core/widgets/safe_network_image.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:event_tree/features/dashboard/application/dashboard_providers.dart';
import 'package:event_tree/features/dashboard/presentation/event_editor_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// A host's own events: drag to reorder, switch to hide, tap to edit.
///
/// Hidden events stay in this list but drop off the public page, which
/// is the on/off switch Linktree made everyone expect. The order here
/// is the order visitors see.
class MyEventsList extends ConsumerWidget {
  /// Creates the list.
  const new({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final events = ref.watch(myEventsProvider);
    return Stack(
      children: [
        AsyncView<List<EventDto>>(
          value: events,
          onRetry: () => ref.invalidate(myEventsProvider),
          data: (list) =>
              list.isEmpty ? const _NoEvents() : _Reorderable(events: list),
        ),
        Positioned(
          right: AppSpacing.lg,
          bottom: AppSpacing.lg,
          child: FloatingActionButton.extended(
            onPressed: () =>
                unawaited(EventEditorScreen.open(context, event: null)),
            icon: const Icon(LucideIcons.plus),
            label: const Text('Post an event'),
          ),
        ),
      ],
    );
  }
}

/// The draggable list.
class _Reorderable extends ConsumerWidget {
  const new({required this.events});

  final List<EventDto> events;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ReorderableListView.builder(
      padding: const EdgeInsets.fromLTRB(AppSpacing.lg, 0, AppSpacing.lg, 96),
      itemCount: events.length,
      onReorderItem: (from, to) => unawaited(_move(ref, from, to)),
      itemBuilder: (context, index) {
        final event = events[index];
        return _Row(key: ValueKey(event.id), event: event, index: index);
      },
    );
  }

  Future<void> _move(WidgetRef ref, int from, int to) async {
    // onReorderItem already accounts for the removed item, so `to` is
    // the index to insert at.
    final ids = [for (final event in events) event.id];
    ids.insert(to, ids.removeAt(from));
    await ref.read(dashboardActionsProvider).reorder(ids);
  }
}

/// One of the host's events.
class _Row extends ConsumerWidget {
  const new({required this.event, required this.index, super.key});

  final EventDto event;
  final int index;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Card(
        child: Opacity(
          opacity: event.hidden ? 0.5 : 1,
          child: Row(
            children: [
              ReorderableDragStartListener(
                index: index,
                child: const Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm,
                    vertical: AppSpacing.lg,
                  ),
                  child: Icon(
                    LucideIcons.gripVertical,
                    size: 18,
                    color: AppColors.textSubtle,
                  ),
                ),
              ),
              Expanded(
                child: InkWell(
                  onTap: () =>
                      unawaited(EventEditorScreen.open(context, event: event)),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                      vertical: AppSpacing.sm,
                    ),
                    child: Row(
                      children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(AppRadii.md),
                          child: SizedBox(
                            width: 44,
                            height: 44,
                            child: SafeNetworkImage(
                              url: event.coverImage?.url ?? '',
                              fallback: ColoredBox(
                                color: AppColors.surfaceRaised,
                                child: Icon(
                                  iconForCategory(event.category),
                                  size: 18,
                                  color: AppColors.textSubtle,
                                ),
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.md),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                event.title,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppType.title,
                              ),
                              Text(
                                event.listSubtitle,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: AppType.caption.copyWith(
                                  color: AppColors.textMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
              Switch.adaptive(
                value: !event.hidden,
                onChanged: (visible) =>
                    unawaited(_setVisible(context, ref, visible: visible)),
              ),
              IconButton(
                tooltip: 'Delete',
                icon: const Icon(LucideIcons.trash2, size: 18),
                color: AppColors.textMuted,
                onPressed: () => unawaited(_confirmDelete(context, ref)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _setVisible(
    BuildContext context,
    WidgetRef ref, {
    required bool visible,
  }) async {
    final messenger = ScaffoldMessenger.of(context);
    try {
      await ref
          .read(dashboardActionsProvider)
          .setHidden(event.id, hidden: !visible);
    } on ApiError catch (error) {
      messenger.showSnackBar(SnackBar(content: Text(error.message)));
    }
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref) async {
    final messenger = ScaffoldMessenger.of(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete this event?'),
        content: Text(
          '"${event.title}" and its reviews and photos go for good. '
          'To take it off your page without losing it, use the switch '
          'instead.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Keep it'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Delete'),
          ),
        ],
      ),
    );
    if (confirmed != true) return;
    try {
      await ref.read(dashboardActionsProvider).deleteEvent(event.id);
    } on ApiError catch (error) {
      messenger.showSnackBar(SnackBar(content: Text(error.message)));
    }
  }
}

/// The host has a page but has posted nothing.
class _NoEvents extends StatelessWidget {
  const new();

  @override
  Widget build(BuildContext context) => const EmptyState(
    icon: LucideIcons.calendarPlus,
    heading: 'Nothing posted yet',
    message:
        'Post your first event and it appears on your page and in '
        'Discover, where every student can find it.',
  );
}
