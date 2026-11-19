import 'package:event_tree/core/analytics/screen_names.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('screenNameFor', () {
    test('the fixed screens have their own names', () {
      expect(screenNameFor('/explore'), 'discover');
      expect(screenNameFor('/'), 'discover');
      expect(screenNameFor('/admin'), 'dashboard');
      expect(screenNameFor('/app/saved'), 'saved');
      expect(screenNameFor('/app/profile'), 'profile');
      expect(screenNameFor('/app/claim'), 'claim_username');
    });

    test('a host page and an event are named by shape, not by handle', () {
      expect(screenNameFor('/gdg'), 'host_page');
      expect(screenNameFor('/gdg/devfest-2026'), 'event');
    });

    // The whole point: a handle or a slug must never reach PostHog.
    test('no handle or slug survives', () {
      for (final location in [
        '/gdg',
        '/gdg/devfest-2026',
        '/app/verify?email=someone@example.org',
      ]) {
        final name = screenNameFor(location);
        expect(name, isNot(contains('gdg')));
        expect(name, isNot(contains('devfest')));
        expect(name, isNot(contains('@')));
      }
    });

    test('query strings and fragments are ignored', () {
      expect(screenNameFor('/explore?q=music'), 'discover');
      expect(screenNameFor('/app/verify?email=a@b.c'), 'verify_email');
    });

    test('anything unrecognised reads as other', () {
      expect(screenNameFor('/a/b/c/d'), 'other');
    });
  });
}
