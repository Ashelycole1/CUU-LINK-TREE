import 'package:event_tree/app.dart';
import 'package:event_tree/features/discover/presentation/discover_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'support/fake_api.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() => SharedPreferences.setMockInitialValues({}));

  testWidgets('the app starts on Discover with four tabs', (tester) async {
    await tester.pumpWidget(
      withFakeApi(
        fakeApiDio({'/community': communityJson()}),
        child: const EventTreeApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.byType(DiscoverScreen), findsOneWidget);
    expect(find.byType(NavigationDestination), findsNWidgets(4));
    for (final label in ['Discover', 'Saved', 'Dashboard', 'Profile']) {
      expect(find.text(label), findsWidgets);
    }
  });

  testWidgets('the app uses the dark theme', (tester) async {
    await tester.pumpWidget(
      withFakeApi(
        fakeApiDio({'/community': communityJson()}),
        child: const EventTreeApp(),
      ),
    );
    await tester.pumpAndSettle();

    final context = tester.element(find.byType(DiscoverScreen));
    expect(Theme.of(context).brightness, Brightness.dark);
    expect(Theme.of(context).scaffoldBackgroundColor, const Color(0xFF121212));
  });
}
