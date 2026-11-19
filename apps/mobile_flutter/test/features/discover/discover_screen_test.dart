import 'package:dio/dio.dart';
import 'package:event_tree/core/theme/app_theme.dart';
import 'package:event_tree/core/widgets/event_row.dart';
import 'package:event_tree/features/discover/presentation/discover_screen.dart';
import 'package:event_tree/features/discover/presentation/widgets/host_rail.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../support/fake_api.dart';

Future<void> pumpDiscover(WidgetTester tester, Dio dio) async {
  await tester.pumpWidget(
    withFakeApi(
      dio,
      child: MaterialApp(theme: AppTheme.dark(), home: const DiscoverScreen()),
    ),
  );
  await tester.pumpAndSettle();
}

Map<String, Object?> feedWithOneEvent() => communityJson(
  events: [communityEventJson()],
  categories: [
    {'name': 'Tech', 'count': 1},
  ],
  pages: [
    {
      'username': 'gdg',
      'displayName': 'GDG Kampala',
      'avatarUrl': '',
      'color': '#FFC72C',
      'upcoming': 1,
      'past': 0,
    },
  ],
);

void main() {
  testWidgets('shows the feed, its chips and its hosts', (tester) async {
    await pumpDiscover(tester, fakeApiDio({'/community': feedWithOneEvent()}));

    expect(find.text('Discover'), findsOneWidget);
    expect(find.text('DevFest Kampala 2026'), findsWidgets);
    expect(find.text('All'), findsOneWidget);
    expect(find.text('Tech  1'), findsOneWidget);
    expect(find.byType(EventRow), findsOneWidget);
    expect(find.byType(HostRail), findsOneWidget);
  });

  testWidgets('says so when no host has posted anything', (tester) async {
    await pumpDiscover(tester, fakeApiDio({'/community': communityJson()}));

    expect(find.text('No events yet'), findsOneWidget);
    expect(find.byType(EventRow), findsNothing);
  });

  testWidgets('offers Retry when the phone is offline', (tester) async {
    await pumpDiscover(tester, offlineApiDio());

    expect(find.text('No connection'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, 'Retry'), findsOneWidget);
  });

  testWidgets('tapping a category asks the server for it', (tester) async {
    final asked = <RequestOptions>[];
    await pumpDiscover(
      tester,
      fakeApiDio({'/community': feedWithOneEvent()}, recorded: asked),
    );

    await tester.tap(find.text('Tech  1'));
    await tester.pumpAndSettle();

    expect(asked, hasLength(2));
    expect(asked.last.queryParameters, {'category': 'Tech'});
  });
}
