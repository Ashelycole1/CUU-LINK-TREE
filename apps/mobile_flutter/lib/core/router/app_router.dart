import 'package:event_tree/core/analytics/analytics.dart';
import 'package:event_tree/core/analytics/analytics_observer.dart';
import 'package:event_tree/core/analytics/posthog_analytics.dart';
import 'package:event_tree/features/auth/presentation/claim_username_screen.dart';
import 'package:event_tree/features/auth/presentation/sign_in_screen.dart';
import 'package:event_tree/features/auth/presentation/sign_up_screen.dart';
import 'package:event_tree/features/auth/presentation/verify_email_screen.dart';
import 'package:event_tree/features/dashboard/presentation/dashboard_screen.dart';
import 'package:event_tree/features/discover/presentation/discover_screen.dart';
import 'package:event_tree/features/event/presentation/event_screen.dart';
import 'package:event_tree/features/page/presentation/host_page_screen.dart';
import 'package:event_tree/features/saved/presentation/saved_screen.dart';
import 'package:event_tree/features/settings/presentation/analytics_settings_screen.dart';
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
/// Saved, Profile and the account steps exist only in the app. They
/// live under `/app/`, which is a reserved username
/// (`Username.RESERVED` in packages/core), so they can never collide
/// with a host's page.
abstract final class AppRoutes {
  /// The Discover tab (web: Community).
  static const String discover = '/explore';

  /// The Saved tab (app only).
  static const String saved = '/app/saved';

  /// The host Dashboard tab (web: `/admin`).
  static const String dashboard = '/admin';

  /// The Profile tab (app only).
  static const String profile = '/app/profile';

  /// Logging in (app only).
  static const String signIn = '/app/signin';

  /// Creating a host account (app only).
  static const String signUp = '/app/signup';

  /// Entering the emailed sign-up code. Takes `?email=`.
  static const String verifyEmail = '/app/verify';

  /// Picking a handle, which creates the page (app only).
  static const String claimUsername = '/app/claim';

  /// The analytics opt-out (app only).
  static const String analyticsSettings = '/app/analytics';

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
///
/// [analytics] gets a `page_viewed` for every screen that is pushed;
/// it defaults to doing nothing, which is what tests want.
GoRouter buildAppRouter({
  String initialLocation = AppRoutes.discover,
  Analytics analytics = const NoopAnalytics(),
}) {
  return GoRouter(
    initialLocation: initialLocation,
    observers: [AnalyticsRouteObserver(analytics)],
    redirect: (context, state) => AppRoutes.redirect(state.uri),
    errorBuilder: (context, state) => const NotFoundScreen(),
    // Order matters: the tabs' and the account steps' fixed paths must
    // match before `/:username`.
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
      // The account steps sit outside the tabs: they are a flow, and a
      // bottom bar in the middle of one is an invitation to abandon it.
      GoRoute(
        path: AppRoutes.signIn,
        builder: (context, state) => const SignInScreen(),
      ),
      GoRoute(
        path: AppRoutes.signUp,
        builder: (context, state) => const SignUpScreen(),
      ),
      GoRoute(
        path: AppRoutes.verifyEmail,
        builder: (context, state) =>
            VerifyEmailScreen(email: state.uri.queryParameters['email'] ?? ''),
      ),
      GoRoute(
        path: AppRoutes.claimUsername,
        builder: (context, state) => const ClaimUsernameScreen(),
      ),
      GoRoute(
        path: AppRoutes.analyticsSettings,
        builder: (context, state) => const AnalyticsSettingsScreen(),
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
  final router = buildAppRouter(analytics: ref.watch(analyticsProvider));
  ref.onDispose(router.dispose);
  return router;
});
