import 'package:dio/dio.dart';
import 'package:event_tree/core/network/api_error.dart';
import 'package:event_tree/core/network/dio_provider.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:event_tree/data/models/profile.dart';
import 'package:event_tree/data/repositories/pages_repository.dart';
import 'package:flutter_test/flutter_test.dart';

import '../../support/fake_api.dart';

void main() {
  group('PagesRepository', () {
    test('getCommunity reads the feed, its hosts and its counts', () async {
      final repository = PagesRepository(
        fakeApiDio({
          '/community': communityJson(
            events: [communityEventJson()],
            categories: [
              {'name': 'Tech', 'count': 3},
            ],
            pages: [
              {
                'username': 'gdg',
                'displayName': 'GDG Kampala',
                'avatarUrl': '',
                'color': '#FFC72C',
                'upcoming': 1,
                'past': 4,
              },
            ],
          ),
        }),
      );

      final feed = await repository.getCommunity();

      expect(feed.events, hasLength(1));
      expect(feed.events.first.event.title, 'DevFest Kampala 2026');
      expect(feed.events.first.host.username, 'gdg');
      expect(feed.categories.single.count, 3);
      expect(feed.pages.single.past, 4);
      expect(feed.totals.events, 1);
    });

    test('getPage reads the profile, its appearance and both lists', () async {
      final repository = PagesRepository(
        fakeApiDio({
          '/pages/gdg': treeJson(
            upcoming: [eventJson()],
            past: [eventJson(id: 'evt_0', slug: 'old', status: 'past')],
          ),
        }),
      );

      final page = await repository.getPage('gdg');

      expect(page.profile.username, 'gdg');
      expect(page.profile.appearance.buttonStyle, PageButtonStyle.ticket);
      expect(page.profile.appearance.colors.card, '#1C1C24');
      expect(page.upcoming.single.status, EventStatus.upcoming);
      expect(page.past.single.status, EventStatus.past);
    });

    test('listPageEvents sends the when filter', () async {
      final asked = <RequestOptions>[];
      final repository = PagesRepository(
        fakeApiDio({
          '/pages/gdg/events': [eventJson()],
        }, recorded: asked),
      );

      final events = await repository.listPageEvents(
        'gdg',
        EventListQuery.past,
      );

      expect(events, hasLength(1));
      expect(asked.single.queryParameters, {'when': 'past'});
    });

    test('getPageEvent escapes the username and the slug', () async {
      final repository = PagesRepository(
        fakeApiDio({'/pages/gdg/events/a%20b': eventJson(slug: 'a b')}),
      );

      final event = await repository.getPageEvent('gdg', 'a b');

      expect(event.slug, 'a b');
    });

    test('a missing page becomes a not-found ApiError', () async {
      final repository = PagesRepository(fakeApiDio({}));

      await expectLater(
        repository.getPage('nobody'),
        throwsA(
          isA<ApiError>()
              .having((e) => e.isNotFound, 'isNotFound', isTrue)
              .having((e) => e.code, 'code', 'NOT_FOUND'),
        ),
      );
    });

    test('no connection becomes a network ApiError', () async {
      final repository = PagesRepository(offlineApiDio());

      await expectLater(
        repository.getCommunity(),
        throwsA(
          isA<ApiError>()
              .having((e) => e.isNetwork, 'isNetwork', isTrue)
              .having((e) => e.message, 'message', contains('reach')),
        ),
      );
    });

    test(
      'a build without API_BASE_URL fails with a readable message',
      () async {
        final repository = PagesRepository(buildApiDio(origin: ''));

        await expectLater(
          repository.getCommunity(),
          throwsA(
            isA<ApiError>().having((e) => e.code, 'code', 'NO_API_BASE_URL'),
          ),
        );
      },
    );
  });
}
