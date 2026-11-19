import 'package:event_tree/core/util/format.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('Format', () {
    final start = DateTime(2026, 12, 4, 14);
    final end = DateTime(2026, 12, 4, 17, 30);

    test('parse returns null for anything unreadable', () {
      expect(Format.parse(''), isNull);
      expect(Format.parse('not a date'), isNull);
      expect(Format.parse('2026-12-04T11:00:00.000Z'), isNotNull);
    });

    test('dayMonth gives a ticket stub', () {
      final stub = Format.dayMonth(start);
      expect(stub.day, '4');
      expect(stub.month, 'DEC');
    });

    test('shortDate and time read as a person would say them', () {
      expect(Format.shortDate(start), 'Fri 4 Dec');
      expect(Format.time(start), '2:00 PM');
      expect(Format.time(DateTime(2026, 12, 4)), '12:00 AM');
      expect(Format.time(DateTime(2026, 12, 4, 12, 5)), '12:05 PM');
    });

    test('dateRange keeps one date when the event ends the same day', () {
      expect(
        Format.dateRange(start, end),
        'Fri 4 Dec 2026 · 2:00 PM – 5:30 PM',
      );
    });

    test('dateRange shows both dates when it runs past midnight', () {
      final late = DateTime(2026, 12, 5, 1);
      expect(Format.dateRange(start, late), contains('5 Dec'));
    });

    test('countdown counts down, then says it is on, then that it ended', () {
      expect(
        Format.countdown(
          start,
          end,
          now: start.subtract(const Duration(days: 3, hours: 4)),
        ),
        'in 3d 4h',
      );
      expect(
        Format.countdown(
          start,
          end,
          now: start.subtract(const Duration(hours: 2, minutes: 10)),
        ),
        'in 2h 10m',
      );
      expect(
        Format.countdown(
          start,
          end,
          now: start.subtract(const Duration(seconds: 30)),
        ),
        'in 1m',
      );
      expect(Format.countdown(start, end, now: start), 'Happening now');
      expect(Format.countdown(start, end, now: end), 'Ended');
    });

    test('reviewCount agrees with itself about plurals', () {
      expect(Format.reviewCount(0), '');
      expect(Format.reviewCount(1), '1 review');
      expect(Format.reviewCount(4), '4 reviews');
    });
  });
}
