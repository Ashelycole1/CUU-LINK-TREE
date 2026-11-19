import 'dart:async';

import 'package:event_tree/core/analytics/analytics_events.dart';
import 'package:event_tree/core/analytics/posthog_analytics.dart';
import 'package:event_tree/core/router/app_router.dart';
import 'package:event_tree/core/theme/page_theme.dart';
import 'package:event_tree/core/theme/tokens.dart';
import 'package:event_tree/core/util/links.dart';
import 'package:event_tree/core/widgets/async_view.dart';
import 'package:event_tree/core/widgets/page_top_bar.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:event_tree/data/models/profile.dart';
import 'package:event_tree/data/providers/public_pages.dart';
import 'package:event_tree/data/providers/saved_providers.dart';
import 'package:event_tree/data/repositories/event_actions_repository.dart';
import 'package:event_tree/features/event/application/event_providers.dart';
import 'package:event_tree/features/event/presentation/widgets/event_actions.dart';
import 'package:event_tree/features/event/presentation/widgets/event_facts.dart';
import 'package:event_tree/features/event/presentation/widgets/event_gallery.dart';
import 'package:event_tree/features/event/presentation/widgets/event_hero.dart';
import 'package:event_tree/features/event/presentation/widgets/event_link_button.dart';
import 'package:event_tree/features/event/presentation/widgets/review_section.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// One event at `/:username/:slug`, in the host's own colours.
///
/// The page follows the event's life, as the web page does: before it
/// starts the countdown and the sign-up link lead; while it is on, the
/// live links; afterwards, what is left of it. Photos and reviews join
/// in phase 5, saving and reminders in phase 3.
class EventScreen extends ConsumerStatefulWidget {
  /// Opens [slug] on [username]'s page.
  const new({required this.username, required this.slug, super.key});

  /// The host's handle, without the `@`.
  final String username;

  /// The event's slug.
  final String slug;

  @override
  ConsumerState<EventScreen> createState() => _EventScreenState();
}

class _EventScreenState extends ConsumerState<EventScreen> {
  bool _reported = false;

  /// Reports `event_opened` once the event is known, and only once:
  /// a rebuild is not a second opening (plan §6).
  void _reportOpened(EventDto event) {
    if (_reported) return;
    _reported = true;
    unawaited(
      ref
          .read(analyticsProvider)
          .track(
            AnalyticsEvents.eventOpened,
            properties: {'event_status': event.status.wire},
          ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final username = widget.username;
    final slug = widget.slug;
    final key = (username: username, slug: slug);
    final event = ref.watch(pageEventProvider(key));
    // The host's page is read for its colours only, exactly as the web
    // event page does. Opening from a host's page costs no new request.
    final appearance = ref
        .watch(hostPageProvider(username))
        .value
        ?.profile
        .appearance;
    final theme = appearance == null
        ? null
        : PageTheme.fromAppearance(appearance);
    return Scaffold(
      backgroundColor: theme?.background ?? AppColors.background,
      body: Stack(
        children: [
          AsyncView<EventDto>(
            value: event,
            onRetry: () => ref.invalidate(pageEventProvider(key)),
            data: (loaded) {
              _reportOpened(loaded);
              return _Event(
                event: loaded,
                theme: theme ?? PageTheme.fromAppearance(const AppearanceDto()),
                username: username,
              );
            },
          ),
          PageTopBar(
            theme: theme,
            shareUrl: Links.eventUrl(username, slug),
            shareLabel: 'Share this event',
            shareTitle: event.value?.title,
            fallbackLocation: AppRoutes.page(username),
          ),
        ],
      ),
    );
  }
}

/// The loaded event.
class _Event extends ConsumerWidget {
  const new({required this.event, required this.theme, required this.username});

  final EventDto event;
  final PageTheme theme;
  final String username;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final key = (username: username, slug: event.slug);
    final links = event.sortedLinks
        .where((link) => link.url.isNotEmpty)
        .toList();
    final actions = ref.read(eventActionsRepositoryProvider);
    return PageThemeScope(
      theme: theme,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 72, 16, 40),
        children: [
          EventHero(event: event, theme: theme),
          const SizedBox(height: 18),
          EventActions(
            event: event,
            theme: theme,
            saved: isEventSaved(ref.watch(savedProvider), event.id),
            onToggleSave: () => unawaited(_toggleSave(context, ref)),
          ),
          const SizedBox(height: 20),
          EventFacts(event: event, theme: theme),
          if (event.description.isNotEmpty) ...[
            const SizedBox(height: 24),
            Text(
              event.description,
              style: theme.textStyle(size: 16, height: 1.55),
            ),
          ],
          if (links.isNotEmpty) ...[
            const SizedBox(height: 28),
            for (final link in links)
              Padding(
                padding: const EdgeInsets.only(bottom: 10),
                child: EventLinkButton(
                  link: link,
                  theme: theme,
                  onTap: () => unawaited(_open(context, ref, actions, link)),
                ),
              ),
          ],
          EventGallery(event: event, theme: theme, eventKey: key),
          ReviewSection(event: event, theme: theme, eventKey: key),
          const SizedBox(height: 24),
          _MoreFromHost(username: username, theme: theme),
        ],
      ),
    );
  }

  /// Saves or forgets the event, and says which just happened.
  Future<void> _toggleSave(BuildContext context, WidgetRef ref) async {
    final messenger = ScaffoldMessenger.of(context);
    final saved = await ref
        .read(savedProvider.notifier)
        .toggleSave(event, username: username);
    messenger
      ..clearSnackBars()
      ..showSnackBar(
        SnackBar(
          content: Text(
            saved
                ? 'Saved. A reminder a day and an hour before.'
                : 'Removed from saved.',
          ),
        ),
      );
  }

  Future<void> _open(
    BuildContext context,
    WidgetRef ref,
    EventActionsRepository actions,
    EventLinkDto link,
  ) async {
    final messenger = ScaffoldMessenger.of(context);
    final opened = await openEventLink(
      actions,
      eventId: event.id,
      url: link.url,
      kind: link.kind,
      analytics: ref.read(analyticsProvider),
    );
    if (!opened) {
      messenger.showSnackBar(
        const SnackBar(content: Text('That link could not be opened.')),
      );
    }
  }
}

/// A quiet link back to the host's whole page.
class _MoreFromHost extends StatelessWidget {
  const new({required this.username, required this.theme});

  final String username;
  final PageTheme theme;

  @override
  Widget build(BuildContext context) => Align(
    alignment: Alignment.centerLeft,
    child: TextButton.icon(
      onPressed: () => unawaited(context.push(AppRoutes.page(username))),
      icon: Icon(LucideIcons.arrowRight, size: 16, color: theme.text),
      label: Text(
        'More from @$username',
        style: theme.textStyle(size: 15, weight: FontWeight.w600),
      ),
    ),
  );
}
