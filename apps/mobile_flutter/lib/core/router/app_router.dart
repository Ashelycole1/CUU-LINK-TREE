import 'package:event_tree/features/dashboard/presentation/dashboard_screen.dart';
import 'package:event_tree/features/discover/presentation/discover_screen.dart';
import 'package:event_tree/features/event/presentation/event_screen.dart';
import 'package:event_tree/features/page/presentation/host_page_screen.dart';
import 'package:event_tree/features/saved/presentation/saved_screen.dart';
import 'package:event_tree/features/settings/presentation/profile_screen.dart';
import 'package:event_tree/features/shell/presentation/app_shell.dart';
import 'package:event_tree/features/shell/presentation/not_found_screen.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// The app's URLs. Shared screens use the same paths as `apps/web`
/// (`src/App.tsx`), so a shared web link opens the same screen in the app.
///
/// | Web route          | App screen                |
/// |--------------------|---------------------------|
/// | `/explore`         | Discover tab              |
/// | `/admin`           | Dashboard tab             |
/// | `/:username`       | A host's page             |
/// | `/:username/:slug` | One event                 |
///
/// Saved and Profile exist only in the app. They live under `/app/`, which
/// is a reserved username (`Username.RESERVED` in packages/core), so they
/// can never collide with a host's page.
abstract final class AppRoutes {
  /// The Discover tab (web: Community).
  static const String discover = '/explore';

  /// The Saved tab (app only).
  static const String saved = '/app/saved';

  /// The host Dashboard tab (web: `/admin`).
  static const String dashboard = '/admin';

  /// The Profile tab (app only).
  static const String profile = '/app/profile';

  /// A host's public page.
  static String page(String username) => '/${Uri.encodeComponent(username)}';

  /// One event on a host's page.
  static String event(String username, String slug) =>
      '${page(username)}/${Uri.encodeComponent(slug)}';

  /// Where the web's landing page (`/`) and the bare `/app` prefix lead.
  @visibleForTesting
  static String? redirect(Uri uri) => switch (uri.path) {
    '/' || '' || '/app' || '/app/' => discover,
    _ => null,
  };
}

/// Builds the app's router. Tests can pass an [initialLocation].
GoRouter buildAppRouter({String initialLocation = AppRoutes.discover}) {
  return GoRouter(
    initialLocation: initialLocation,
    redirect: (context, state) => AppRoutes.redirect(state.uri),
    errorBuilder: (context, state) => const NotFoundScreen(),
    // Order matters: the tabs' fixed paths must match before `/:username`.
    routes: [
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => AppShell(navigationShell: shell),
        branches: [
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.discover,
                builder: (context, state) => const DiscoverScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.saved,
                builder: (context, state) => const SavedScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.dashboard,
                builder: (context, state) => const DashboardScreen(),
              ),
            ],
          ),
          StatefulShellBranch(
            routes: [
              GoRoute(
                path: AppRoutes.profile,
                builder: (context, state) => const ProfileScreen(),
              ),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/:username',
        builder: (context, state) =>
            HostPageScreen(username: state.pathParameters['username'] ?? ''),
        routes: [
          GoRoute(
            path: ':slug',
            builder: (context, state) => EventScreen(
              username: state.pathParameters['username'] ?? '',
              slug: state.pathParameters['slug'] ?? '',
            ),
          ),
        ],
      ),
    ],
  );
}

/// The one app-wide router.
final appRouterProvider = Provider<GoRouter>((ref) {
  final router = buildAppRouter();
  ref.onDispose(router.dispose);
  return router;
});
