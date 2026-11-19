import 'package:flutter/widgets.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// An icon for each event category, used everywhere the web app would
/// show `EventDTO.emoji`.
///
/// The app shows no emojis (plan §4), and older events carry free-text
/// categories, so [iconForCategory] folds anything it is given into one
/// of the eleven names in `packages/core/src/events/categories.ts`.
IconData iconForCategory(String category) =>
    switch (normalizeCategory(category)) {
      'Music' => LucideIcons.music,
      'Talks' => LucideIcons.micVocal,
      'Tech' => LucideIcons.code,
      'Sports' => LucideIcons.trophy,
      'Party' => LucideIcons.partyPopper,
      'Workshop' => LucideIcons.wrench,
      'Community' => LucideIcons.users,
      'Arts' => LucideIcons.palette,
      'Food' => LucideIcons.utensils,
      'Faith' => LucideIcons.church,
      _ => LucideIcons.calendar,
    };

/// The fixed category names, in the order the server lists them.
const List<String> eventCategories = [
  'Music',
  'Talks',
  'Tech',
  'Sports',
  'Party',
  'Workshop',
  'Community',
  'Arts',
  'Food',
  'Faith',
  'Other',
];

/// Folds any category text into one of [eventCategories].
///
/// A port of `toCategory()` in `packages/core/src/events/categories.ts`:
/// an exact name in any case wins, then the first keyword that matches,
/// else "Other". Keep the two in step.
String normalizeCategory(String? raw) {
  final text = (raw ?? '').trim().toLowerCase();
  if (text.isEmpty) return 'Other';
  for (final name in eventCategories) {
    if (name.toLowerCase() == text) return name;
  }
  for (final (name, pattern) in _matchers) {
    if (pattern.hasMatch(text)) return name;
  }
  return 'Other';
}

final List<(String, RegExp)> _matchers = [
  ('Music', _music),
  ('Tech', _tech),
  ('Talks', _talks),
  ('Sports', _sports),
  ('Party', _party),
  ('Workshop', _workshop),
  ('Arts', _arts),
  ('Food', _food),
  ('Faith', _faith),
  ('Community', _community),
];

final RegExp _music = RegExp(
  'music|concert|gig|band|dj|song|jazz|choir|festival|karaoke',
);
final RegExp _tech = RegExp(
  r'tech|code|coding|dev|hack|software|startup|ai\b|data|build',
);
final RegExp _talks = RegExp(
  'talk|panel|conference|speak|lecture|seminar|summit|forum|meetup',
);
final RegExp _sports = RegExp(
  'sport|run|match|game|fitness|final|football|soccer|race|marathon'
  '|yoga|gym',
);
final RegExp _party = RegExp('party|night|club|rave|celebrat|birthday');
final RegExp _workshop = RegExp(
  'workshop|class|training|course|bootcamp|lesson',
);
final RegExp _arts = RegExp(
  'art|film|cinema|theat|exhibit|gallery|dance|poetry|comedy'
  '|fashion|photo',
);
final RegExp _food = RegExp(
  'food|dinner|lunch|brunch|cook|tasting|wine|beer|coffee|market',
);
final RegExp _faith = RegExp(
  'church|faith|worship|prayer|mosque|fellowship|gospel|bible',
);
final RegExp _community = RegExp(
  'community|social|charity|volunteer|network|family|kids|school',
);
