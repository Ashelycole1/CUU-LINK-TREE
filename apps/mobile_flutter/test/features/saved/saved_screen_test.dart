import 'package:event_tree/core/theme/app_theme.dart';
import 'package:event_tree/data/models/saved_event.dart';
import 'package:event_tree/data/repositories/saved_repository.dart';
import 'package:event_tree/features/saved/presentation/saved_screen.dart';
import 'package:event_tree/features/saved/presentation/widgets/saved_event_row.dart';
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../support/fake_api.dart';

Future<void> pumpSaved(WidgetTester tester) async {
  await tester.pumpWidget(
    withFakeApi(
      fakeApiDio(const {}),
      // There is no notification plugin in a test VM, and cancelling a
      // reminder through the real one throws.
      notifications: FakeNotifications(),
      child: MaterialApp(theme: AppTheme.dark(), home: const SavedScreen()),
    ),
  );
  await tester.pumpAndSettle();
}

SavedEvent saved({
  required DateTime startsAt,
  String id = 'evt_1',
  String title = 'DevFest Kampala',
}) => SavedEvent(
  id: id,
  username: 'gdg',
  slug: 'devfest',
  title: title,
  venue: 'Main Hall',
  startsAt: startsAt.toUtc().toIso8601String(),
  endsAt: startsAt.add(const Duration(hours: 2)).toUtc().toIso8601String(),
);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() => SharedPreferences.setMockInitialValues({}));

  testWidgets('says what saving is for when nothing is saved', (tester) async {
    await pumpSaved(tester);

    expect(find.text('Saved'), findsOneWidget);
    expect(find.text('Nothing saved yet'), findsOneWidget);
    expect(find.byType(SavedEventRow), findsNothing);
  });

  testWidgets('lists what is coming up, and what is over', (tester) async {
    final repository = await SavedRepository.open();
    await repository.save(
      saved(startsAt: DateTime.now().add(const Duration(days: 3))),
    );
    await repository.save(
      saved(
        id: 'evt_old',
        title: 'Last term',
        startsAt: DateTime.now().subtract(const Duration(days: 30)),
      ),
    );
    await repository.follow('gdg');

    await pumpSaved(tester);

    expect(find.text('Coming up'), findsOneWidget);
    expect(find.text('DevFest Kampala'), findsOneWidget);
    expect(find.text('Been and gone'), findsOneWidget);
    expect(find.text('Last term'), findsOneWidget);
    expect(find.text('Following'), findsOneWidget);
    expect(find.text('gdg'), findsOneWidget);
  });

  testWidgets('removing a saved event takes it off the list', (tester) async {
    final repository = await SavedRepository.open();
    await repository.save(
      saved(startsAt: DateTime.now().add(const Duration(days: 3))),
    );

    await pumpSaved(tester);
    expect(find.byType(SavedEventRow), findsOneWidget);

    await tester.tap(find.byTooltip('Remove from saved'));
    await tester.pumpAndSettle();

    expect(find.byType(SavedEventRow), findsNothing);
    expect(find.text('Nothing saved yet'), findsOneWidget);
  });
}
