import 'dart:io';

import 'package:event_tree/core/analytics/analytics_events.dart';
import 'package:flutter_test/flutter_test.dart';

/// The web's copy of the list, which this one has to agree with.
const String webEventsPath = '../../apps/web/src/lib/analyticsEvents.ts';

void main() {
  group('AnalyticsEvents', () {
    test('every name is snake_case and unique', () {
      final pattern = RegExp(r'^[a-z][a-z0-9_]*$');
      for (final name in AnalyticsEvents.all) {
        expect(pattern.hasMatch(name), isTrue, reason: name);
      }
      expect(
        AnalyticsEvents.all.toSet(),
        hasLength(AnalyticsEvents.all.length),
      );
    });

    test('plan §6 names are all here', () {
      const required = [
        'page_viewed',
        'event_opened',
        'event_link_clicked',
        'event_saved',
        'reminder_scheduled',
        'host_followed',
        'review_added',
        'photo_uploaded',
        'signed_up',
        'username_claimed',
        'event_created',
        'event_updated',
      ];
      for (final name in required) {
        expect(AnalyticsEvents.all, contains(name), reason: name);
      }
    });

    // The whole point of one list is that it is one list. This fails the
    // moment somebody adds a name on one side only (plan §6).
    test('the web sends the same names', () {
      final file = File(webEventsPath);
      if (!file.existsSync()) {
        markTestSkipped('Run from apps/mobile_flutter to check the web.');
        return;
      }
      final source = file.readAsStringSync();
      final webNames = RegExp('"([a-z][a-z0-9_]*)"')
          .allMatches(source)
          .map((match) => match.group(1))
          .nonNulls
          .toSet();

      for (final name in AnalyticsEvents.all) {
        expect(
          webNames,
          contains(name),
          reason:
              '$name is missing from '
              'apps/web/src/lib/analyticsEvents.ts',
        );
      }
    });
  });
}
