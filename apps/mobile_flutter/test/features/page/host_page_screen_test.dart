import 'package:dio/dio.dart';
import 'package:event_tree/core/theme/app_theme.dart';
import 'package:event_tree/core/widgets/event_tile.dart';
import 'package:event_tree/features/page/presentation/host_page_screen.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../support/fake_api.dart';

Future<void> pumpPage(WidgetTester tester, Dio dio) async {
  await tester.pumpWidget(
    withFakeApi(
      dio,
      child: MaterialApp(
        theme: AppTheme.dark(),
        home: const HostPageScreen(username: 'gdg'),
      ),
    ),
  );
  await tester.pumpAndSettle();
}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  // Saving and following read the phone's own store.
  setUp(() => SharedPreferences.setMockInitialValues({}));

  testWidgets('shows the host, their colours and their events', (tester) async {
    await pumpPage(
      tester,
      fakeApiDio({
        '/pages/gdg': treeJson(upcoming: [eventJson()]),
        '/pages/gdg/views': <String, Object?>{},
      }),
    );

    expect(find.text('GDG Kampala'), findsOneWidget);
    expect(find.text('@gdg'), findsOneWidget);
    expect(find.text('Upcoming'), findsOneWidget);
    expect(find.byType(EventTile), findsOneWidget);

    final scaffold = tester.widget<Scaffold>(find.byType(Scaffold));
    expect(scaffold.backgroundColor, const Color(0xFF101014));
  });

  testWidgets('counts one visit when the page opens', (tester) async {
    final asked = <RequestOptions>[];
    await pumpPage(
      tester,
      fakeApiDio({
        '/pages/gdg': treeJson(),
        '/pages/gdg/views': <String, Object?>{},
      }, recorded: asked),
    );

    expect(asked.where((o) => o.path == '/pages/gdg/views'), hasLength(1));
  });

  testWidgets('past events stay folded away until asked for', (tester) async {
    await pumpPage(
      tester,
      fakeApiDio({
        '/pages/gdg': treeJson(
          past: [
            eventJson(
              id: 'old',
              slug: 'old',
              title: 'Last year',
              status: 'past',
            ),
          ],
        ),
        '/pages/gdg/views': <String, Object?>{},
      }),
    );

    expect(find.text('Past events (1)'), findsOneWidget);
    expect(find.text('Last year'), findsNothing);

    await tester.tap(find.text('Past events (1)'));
    await tester.pumpAndSettle();

    expect(find.text('Last year'), findsOneWidget);
  });

  testWidgets('a page nobody owns offers Retry', (tester) async {
    await pumpPage(tester, fakeApiDio({}));

    expect(find.text('That did not load'), findsOneWidget);
    expect(find.widgetWithText(FilledButton, 'Retry'), findsOneWidget);
  });
}
