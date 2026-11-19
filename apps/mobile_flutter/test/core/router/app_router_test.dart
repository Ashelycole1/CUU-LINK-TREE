import 'package:event_tree/core/router/app_router.dart';
import 'package:event_tree/core/theme/app_theme.dart';
import 'package:event_tree/features/dashboard/presentation/dashboard_screen.dart';
import 'package:event_tree/features/discover/presentation/discover_screen.dart';
import 'package:event_tree/features/event/presentation/event_screen.dart';
import 'package:event_tree/features/page/presentation/host_page_screen.dart';
import 'package:event_tree/features/saved/presentation/saved_screen.dart';
import 'package:event_tree/features/settings/presentation/profile_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../support/fake_api.dart';

Future<GoRouter> pumpAt(WidgetTester tester, String location) async {
  final router = buildAppRouter(initialLocation: location);
  addTearDown(router.dispose);
  await tester.pumpWidget(
    withFakeApi(
      fakeApiDio({
        '/community': communityJson(),
        '/pages/gdg': treeJson(),
        '/pages/gdg/views': <String, Object?>{},
        '/pages/gdg/events/devfest-2026': eventJson(),
        '/pages/cuucsa': treeJson(
          profile: profileJson(username: 'cuucsa', displayName: 'CUUCSA'),
        ),
        '/pages/cuucsa/views': <String, Object?>{},
      }),
      child: MaterialApp.router(theme: AppTheme.dark(), routerConfig: router),
    ),
  );
  await tester.pumpAndSettle();
  return router;
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  // Saved and the dashboard read the phone's own store.
  setUp(() => SharedPreferences.setMockInitialValues({}));

  group('web URLs open the matching screen', () {
    final cases = <String, Type>{
      '/explore': DiscoverScreen,
      '/admin': DashboardScreen,
      '/app/saved': SavedScreen,
      '/app/profile': ProfileScreen,
      '/gdg': HostPageScreen,
      '/gdg/devfest-2026': EventScreen,
      '/': DiscoverScreen,
      '/app': DiscoverScreen,
    };
    for (final MapEntry(key: path, value: screen) in cases.entries) {
      testWidgets('$path shows $screen', (tester) async {
        await pumpAt(tester, path);
        expect(find.byType(screen), findsOneWidget);
      });
    }
  });

  testWidgets('a host page reads the username from the URL', (tester) async {
    await pumpAt(tester, '/cuucsa');
    expect(find.text('@cuucsa'), findsOneWidget);
  });

  testWidgets('the bottom nav switches tabs and updates the URL', (
    tester,
  ) async {
    final router = await pumpAt(tester, AppRoutes.discover);

    await tester.tap(find.text('Saved'));
    await tester.pumpAndSettle();
    expect(find.byType(SavedScreen), findsOneWidget);
    expect(router.routeInformationProvider.value.uri.path, AppRoutes.saved);

    await tester.tap(find.text('Dashboard'));
    await tester.pumpAndSettle();
    expect(router.routeInformationProvider.value.uri.path, AppRoutes.dashboard);

    await tester.tap(find.text('Profile'));
    await tester.pumpAndSettle();
    expect(router.routeInformationProvider.value.uri.path, AppRoutes.profile);
  });

  test('path builders escape usernames and slugs', () {
    expect(AppRoutes.page('gdg'), '/gdg');
    expect(AppRoutes.event('gdg', 'a b'), '/gdg/a%20b');
  });

  test('app-only tabs sit under a reserved username', () {
    // `app` is in Username.RESERVED (packages/core/src/users/Username.ts),
    // so no host can own /app and hide these tabs.
    expect(AppRoutes.saved, startsWith('/app/'));
    expect(AppRoutes.profile, startsWith('/app/'));
  });
}
