import 'dart:async';

import 'package:event_tree/core/router/app_router.dart';
import 'package:event_tree/core/theme/page_theme.dart';
import 'package:event_tree/core/theme/tokens.dart';
import 'package:event_tree/core/util/links.dart';
import 'package:event_tree/core/widgets/async_view.dart';
import 'package:event_tree/core/widgets/event_tile.dart';
import 'package:event_tree/core/widgets/page_top_bar.dart';
import 'package:event_tree/data/models/tree.dart';
import 'package:event_tree/data/providers/public_pages.dart';
import 'package:event_tree/data/providers/saved_providers.dart';
import 'package:event_tree/data/repositories/pages_repository.dart';
import 'package:event_tree/features/page/application/page_providers.dart';
import 'package:event_tree/features/page/presentation/widgets/follow_button.dart';
import 'package:event_tree/features/page/presentation/widgets/host_header.dart';
import 'package:event_tree/features/page/presentation/widgets/past_events.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// A host's public page at `/:username`, in the host's own colours.
///
/// The one screen in the app that leaves the dark app theme (plan §4):
/// it renders the host's `AppearanceDTO` so the page looks the way they
/// designed it on the web. Back and Share float over it rather than
/// sitting in an app bar, so the host's background reaches the top.
class HostPageScreen extends ConsumerStatefulWidget {
  /// Opens the page belonging to [username].
  const new({required this.username, super.key});

  /// The handle in the URL, without the `@`.
  final String username;

  @override
  ConsumerState<HostPageScreen> createState() => _HostPageScreenState();
}

class _HostPageScreenState extends ConsumerState<HostPageScreen> {
  @override
  void initState() {
    super.initState();
    // One visit per opening, as the web page counts it. Not started in
    // build() (plan §7, rule 6), and failures are swallowed inside.
    unawaited(
      recordPageVisit(ref.read(pagesRepositoryProvider), widget.username),
    );
  }

  @override
  Widget build(BuildContext context) {
    final username = widget.username;
    final page = ref.watch(hostPageProvider(username));
    final loaded = page.value;
    final theme = loaded == null
        ? null
        : PageTheme.fromAppearance(loaded.profile.appearance);
    return Scaffold(
      backgroundColor: theme?.background ?? AppColors.background,
      body: Stack(
        children: [
          AsyncView<TreeDto>(
            value: page,
            onRetry: () => ref.invalidate(hostPageProvider(username)),
            data: (tree) => _Page(tree: tree, username: username),
          ),
          PageTopBar(
            theme: theme,
            shareUrl: theme == null ? '' : Links.pageUrl(username),
            shareLabel: 'Share this page',
            shareTitle: '@$username on Event Tree',
            fallbackLocation: AppRoutes.discover,
          ),
        ],
      ),
    );
  }
}

/// The loaded page: header, Follow, upcoming events, then past ones.
class _Page extends ConsumerWidget {
  const new({required this.tree, required this.username});

  final TreeDto tree;
  final String username;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = PageTheme.fromAppearance(tree.profile.appearance);
    final handle = tree.profile.username.isNotEmpty
        ? tree.profile.username
        : username;
    return PageThemeScope(
      theme: theme,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 72, 16, 40),
        children: [
          HostHeader(
            profile: tree.profile,
            theme: theme,
            onOpen: (url) => unawaited(Links.open(url)),
          ),
          const SizedBox(height: 18),
          Center(
            child: FollowButton(
              theme: theme,
              following: isHostFollowed(ref.watch(savedProvider), handle),
              onToggle: () => unawaited(_toggleFollow(context, ref, handle)),
            ),
          ),
          if (tree.upcoming.isEmpty && tree.past.isEmpty)
            _NoEvents(theme: theme)
          else ...[
            if (tree.upcoming.isNotEmpty) ...[
              _Heading('Upcoming', theme: theme),
              for (final event in tree.upcoming)
                Padding(
                  padding: const EdgeInsets.only(bottom: 14),
                  child: EventTile(
                    event: event,
                    theme: theme,
                    onTap: () => unawaited(
                      context.push(AppRoutes.event(handle, event.slug)),
                    ),
                  ),
                ),
            ],
            if (tree.past.isNotEmpty)
              PastEvents(
                events: tree.past,
                theme: theme,
                onOpen: (event) => unawaited(
                  context.push(AppRoutes.event(handle, event.slug)),
                ),
              ),
          ],
        ],
      ),
    );
  }
}

/// Follows or unfollows the host, and says which just happened.
Future<void> _toggleFollow(
  BuildContext context,
  WidgetRef ref,
  String username,
) async {
  final messenger = ScaffoldMessenger.of(context);
  final following = await ref
      .read(savedProvider.notifier)
      .toggleFollow(username);
  messenger
    ..clearSnackBars()
    ..showSnackBar(
      SnackBar(
        content: Text(
          following
              ? "Following @$username. We'll tell you about new events."
              : 'No longer following @$username.',
        ),
      ),
    );
}

/// A section heading in the host's font.
class _Heading extends StatelessWidget {
  const new(this.text, {required this.theme});

  final String text;
  final PageTheme theme;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 32, bottom: 12),
    child: Semantics(
      header: true,
      child: Text(
        text,
        style: theme.textStyle(size: 18, weight: FontWeight.w800),
      ),
    ),
  );
}

/// The host has a page but has not posted anything yet.
class _NoEvents extends StatelessWidget {
  const new({required this.theme});

  final PageTheme theme;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(top: 40),
    child: Column(
      children: [
        Icon(LucideIcons.calendarOff, color: theme.muted, size: 28),
        const SizedBox(height: 12),
        Text(
          'No events yet',
          style: theme.textStyle(size: 16, weight: FontWeight.w700),
        ),
        const SizedBox(height: 4),
        Text(
          'Check back soon.',
          textAlign: TextAlign.center,
          style: theme.textStyle(size: 15, color: theme.muted),
        ),
      ],
    ),
  );
}
