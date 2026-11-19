import 'package:event_tree/data/models/event.dart';
import 'package:event_tree/data/models/saved_event.dart';
import 'package:event_tree/data/repositories/saved_repository.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

SavedEvent sample({String id = 'evt_1', String startsAt = ''}) => SavedEvent(
  id: id,
  username: 'gdg',
  slug: 'devfest',
  title: 'DevFest',
  startsAt: startsAt.isEmpty
      ? DateTime.now().add(const Duration(days: 3)).toIso8601String()
      : startsAt,
  endsAt: DateTime.now()
      .add(const Duration(days: 3, hours: 2))
      .toIso8601String(),
);

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  setUp(() => SharedPreferences.setMockInitialValues({}));

  group('SavedRepository', () {
    test('saves, finds and forgets an event', () async {
      final repository = await SavedRepository.open();

      expect(repository.isSaved('evt_1'), isFalse);
      await repository.save(sample());
      expect(repository.isSaved('evt_1'), isTrue);
      expect(repository.savedEvents().single.title, 'DevFest');

      await repository.remove('evt_1');
      expect(repository.savedEvents(), isEmpty);
    });

    test('saving the same event twice keeps one copy', () async {
      final repository = await SavedRepository.open();

      await repository.save(sample());
      await repository.save(sample());

      expect(repository.savedEvents(), hasLength(1));
    });

    test('an event with no id is not saved at all', () async {
      final repository = await SavedRepository.open();

      await repository.save(const SavedEvent(title: 'Nameless'));

      expect(repository.savedEvents(), isEmpty);
    });

    test('saved events come back soonest first', () async {
      final repository = await SavedRepository.open();
      final later = DateTime(2030, 6).toIso8601String();
      final sooner = DateTime(2029, 6).toIso8601String();

      await repository.save(sample(id: 'later', startsAt: later));
      await repository.save(sample(id: 'sooner', startsAt: sooner));

      expect(repository.savedEvents().map((event) => event.id), [
        'sooner',
        'later',
      ]);
    });

    test('follows and unfollows a host, forgetting what was seen', () async {
      final repository = await SavedRepository.open();

      await repository.follow('gdg');
      await repository.rememberSeen('gdg', {'a', 'b'});

      expect(repository.isFollowing('gdg'), isTrue);
      expect(repository.seenEvents('gdg'), {'a', 'b'});

      await repository.unfollow('gdg');

      expect(repository.following(), isEmpty);
      expect(repository.seenEvents('gdg'), isEmpty);
    });

    test('following the same host twice changes nothing', () async {
      final repository = await SavedRepository.open();

      await repository.follow('gdg');
      await repository.follow('gdg');

      expect(repository.following(), ['gdg']);
    });

    test('rubbish in storage reads as nothing saved', () async {
      SharedPreferences.setMockInitialValues({
        'saved_events_v1': 'not json at all',
      });
      final repository = await SavedRepository.open();

      expect(repository.savedEvents(), isEmpty);
    });

    test('an event from the API becomes a saved snapshot', () {
      const event = EventDto(
        id: 'evt_9',
        slug: 'devfest',
        title: 'DevFest',
        venue: 'Main Hall',
        category: 'Tech',
        startsAt: '2099-12-04T11:00:00.000Z',
        endsAt: '2099-12-04T15:00:00.000Z',
      );

      final saved = event.toSaved('gdg');

      expect(saved.id, 'evt_9');
      expect(saved.username, 'gdg');
      expect(saved.venue, 'Main Hall');
      expect(saved.isOver, isFalse);
      expect(saved.subtitle, contains('Main Hall'));
    });
  });
}
