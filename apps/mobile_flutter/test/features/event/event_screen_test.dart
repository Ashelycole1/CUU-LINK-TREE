import 'package:dio/dio.dart';
import 'package:event_tree/core/theme/app_theme.dart';
import 'package:event_tree/features/event/presentation/event_screen.dart';
import 'package:event_tree/features/event/presentation/widgets/event_link_button.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../support/fake_api.dart';

Future<void> pumpEvent(WidgetTester tester, Dio dio) async {
  await tester.pumpWidget(
    withFakeApi(
      dio,
      notifications: FakeNotifications(),
      child: MaterialApp(
        theme: AppTheme.dark(),
        home: const EventScreen(username: 'gdg', slug: 'devfest-2026'),
      ),
    ),
  );
  await tester.pumpAndSettle();
}

/// Scrolls the event page until [finder] is on screen.
///
/// The page is long: the facts and the reviews sit below the fold on a
/// test-sized screen, and a `ListView` does not build what it has not
/// scrolled to.
Future<void> scrollTo(WidgetTester tester, Finder finder) async {
  await tester.scrollUntilVisible(
    finder,
    200,
    scrollable: find.byType(Scrollable).first,
  );
  await tester.pumpAndSettle();
}

const Map<String, Object?> _registerLink = {
  'label': 'Register free',
  'url': 'https://example.org/register',
  'kind': 'register',
  'primary': true,
};

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  // Saving and following read the phone's own store.
  setUp(() => SharedPreferences.setMockInitialValues({}));

  testWidgets('shows the event, when it is and its links', (tester) async {
    await pumpEvent(
      tester,
      fakeApiDio({
        '/pages/gdg': treeJson(),
        '/pages/gdg/events/devfest-2026': eventJson(links: [_registerLink]),
      }),
    );

    expect(find.text('DevFest Kampala 2026'), findsOneWidget);
    expect(find.text('UPCOMING EVENT'), findsOneWidget);

    await scrollTo(tester, find.text('Main Hall'));
    expect(find.text('Main Hall'), findsOneWidget);

    await scrollTo(tester, find.byType(EventLinkButton));
    expect(find.text('Register free'), findsOneWidget);
  });

  testWidgets('a live event says so instead of counting down', (tester) async {
    await pumpEvent(
      tester,
      fakeApiDio({
        '/pages/gdg': treeJson(),
        '/pages/gdg/events/devfest-2026': eventJson(
          status: 'live',
          startsAt: '2020-01-01T00:00:00.000Z',
          endsAt: '2099-01-01T00:00:00.000Z',
        ),
      }),
    );

    expect(find.text('HAPPENING NOW'), findsOneWidget);
    expect(find.text('Happening now'), findsOneWidget);
  });

  testWidgets('a past event shows its rating and no countdown', (tester) async {
    await pumpEvent(
      tester,
      fakeApiDio({
        '/pages/gdg': treeJson(),
        '/pages/gdg/events/devfest-2026': eventJson(
          status: 'past',
          startsAt: '2020-01-01T00:00:00.000Z',
          endsAt: '2020-01-01T03:00:00.000Z',
          rating: {
            'count': 4,
            'average': 4.5,
            'distribution': [0, 0, 0, 2, 2],
          },
        ),
      }),
    );

    expect(find.text('PAST EVENT'), findsOneWidget);

    await scrollTo(tester, find.text('4.5 · 4 reviews'));
    expect(find.text('4.5 · 4 reviews'), findsOneWidget);
  });

  testWidgets('an event that is not there offers Retry', (tester) async {
    await pumpEvent(tester, fakeApiDio({'/pages/gdg': treeJson()}));

    expect(find.text('That did not load'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, 'Retry'), findsOneWidget);
  });
}
