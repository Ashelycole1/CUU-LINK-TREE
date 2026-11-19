import 'package:event_tree/data/models/community.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:event_tree/features/discover/application/discover_providers.dart';
import 'package:flutter_test/flutter_test.dart';

CommunityEventDto entry(
  String id,
  DateTime startsAt, {
  EventStatus status = EventStatus.upcoming,
}) => CommunityEventDto(
  event: EventDto(
    id: id,
    title: id,
    status: status,
    startsAt: startsAt.toUtc().toIso8601String(),
    endsAt: startsAt.add(const Duration(hours: 2)).toUtc().toIso8601String(),
  ),
);

void main() {
  group('eventsThisWeek', () {
    final now = DateTime(2026, 12, 1, 9);

    test('keeps what starts within seven days', () {
      final feed = CommunityDto(
        events: [
          entry('tomorrow', now.add(const Duration(days: 1))),
          entry('in six days', now.add(const Duration(days: 6))),
          entry('in three weeks', now.add(const Duration(days: 21))),
        ],
      );

      final week = eventsThisWeek(feed, now: now);

      expect(week.map((e) => e.event.id), ['tomorrow', 'in six days']);
    });

    test('always keeps what is happening right now', () {
      final feed = CommunityDto(
        events: [
          entry(
            'on now',
            now.subtract(const Duration(hours: 1)),
            status: EventStatus.live,
          ),
        ],
      );

      expect(eventsThisWeek(feed, now: now), hasLength(1));
    });

    test('an event with an unreadable date is left out', () {
      const feed = CommunityDto(
        events: [CommunityEventDto(event: EventDto(id: 'broken'))],
      );

      expect(eventsThisWeek(feed, now: now), isEmpty);
    });
  });

  group('CommunityQuery', () {
    test('drops empty values from the query string', () {
      expect(const CommunityQuery().toQueryParameters(), isEmpty);
      expect(
        const CommunityQuery(
          category: 'Tech',
          q: 'devfest',
        ).toQueryParameters(),
        {'category': 'Tech', 'q': 'devfest'},
      );
    });

    test('knows when it is asking for everything', () {
      expect(const CommunityQuery().isEmpty, isTrue);
      expect(const CommunityQuery(q: 'x').isEmpty, isFalse);
    });
  });
}
