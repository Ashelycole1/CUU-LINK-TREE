import 'package:event_tree/core/widgets/category_icon.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  group('normalizeCategory', () {
    test('keeps an exact name, whatever its case', () {
      expect(normalizeCategory('Tech'), 'Tech');
      expect(normalizeCategory('tech'), 'Tech');
      expect(normalizeCategory('  FAITH '), 'Faith');
    });

    test('folds free text the way packages/core does', () {
      expect(normalizeCategory('Hackathon'), 'Tech');
      expect(normalizeCategory('Live concert'), 'Music');
      expect(normalizeCategory('Panel discussion'), 'Talks');
      expect(normalizeCategory('Football final'), 'Sports');
      expect(normalizeCategory('Church service'), 'Faith');
    });

    // The order of the keyword list decides ties, and it has to be the
    // same order as packages/core: "Gospel night" hits Party's "night"
    // before Faith's "gospel" is ever tried, on both sides.
    test('ties break in the same order as the server', () {
      expect(normalizeCategory('Gospel night'), 'Party');
    });

    test('anything else, including nothing, is Other', () {
      expect(normalizeCategory(null), 'Other');
      expect(normalizeCategory(''), 'Other');
      expect(normalizeCategory('zzz'), 'Other');
    });

    test('every category has an icon and none repeat by accident', () {
      final icons = {
        for (final name in eventCategories) name: iconForCategory(name),
      };
      expect(icons, hasLength(eventCategories.length));
      expect(icons.values.toSet(), hasLength(eventCategories.length));
    });
  });
}
