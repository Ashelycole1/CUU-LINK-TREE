/// Date, time and countdown wording.
///
/// A port of `packages/api-client/src/Format.ts`, so the app, the web app
/// and the host dashboard word the same event the same way. The ISO
/// strings from the API are UTC; every helper here shows them in the
/// phone's own time zone.
///
/// The names are written out rather than taken from `intl`, which is not
/// in the plan's package list (§2) and would pull a second date stack in
/// for eleven short words.
library;

const List<String> _weekdays = [
  'Mon',
  'Tue',
  'Wed',
  'Thu',
  'Fri',
  'Sat',
  'Sun',
];

const List<String> _months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

/// Date and time wording shared by every screen.
abstract final class Format {
  /// Reads an API timestamp in the phone's time zone.
  ///
  /// Returns null for an empty or unparsable value, so a bad record shows
  /// a dash instead of crashing the screen (plan §7, rule 2).
  static DateTime? parse(String iso) {
    final value = DateTime.tryParse(iso.trim());
    return value?.toLocal();
  }

  /// The day and the upper-case short month, for a ticket stub: 4, DEC.
  static ({String day, String month}) dayMonth(DateTime at) =>
      (day: '${at.day}', month: _months[at.month - 1].toUpperCase());

  /// "Thu 4 Dec", the line under an event title.
  static String shortDate(DateTime at) =>
      '${_weekdays[at.weekday - 1]} ${at.day} ${_months[at.month - 1]}';

  /// "2:30 PM".
  static String time(DateTime at) {
    final hour = at.hour % 12 == 0 ? 12 : at.hour % 12;
    final minute = at.minute.toString().padLeft(2, '0');
    return '$hour:$minute ${at.hour < 12 ? 'AM' : 'PM'}';
  }

  /// "Thu 4 Dec 2026 · 2:00 PM – 5:00 PM", or with both dates when the
  /// event runs past midnight.
  static String dateRange(DateTime start, DateTime end) {
    final head = '${shortDate(start)} ${start.year}';
    final sameDay =
        start.year == end.year &&
        start.month == end.month &&
        start.day == end.day;
    if (sameDay) return '$head · ${time(start)} – ${time(end)}';
    return '$head ${time(start)} – '
        '${end.day} ${_months[end.month - 1]} ${time(end)}';
  }

  /// "in 3d 4h", "in 2h 10m", "Happening now" or "Ended".
  ///
  /// The server decides an event's status; this is only for display, as
  /// plan §1 allows.
  static String countdown(DateTime start, DateTime end, {DateTime? now}) {
    final at = now ?? DateTime.now();
    if (!at.isBefore(end)) return 'Ended';
    if (!at.isBefore(start)) return 'Happening now';
    final minutes = start.difference(at).inMinutes;
    final days = minutes ~/ 1440;
    final hours = (minutes % 1440) ~/ 60;
    if (days > 0) return 'in ${days}d ${hours}h';
    if (hours > 0) return 'in ${hours}h ${minutes % 60}m';
    return 'in ${minutes < 1 ? 1 : minutes}m';
  }

  /// "4 reviews", "1 review", or an empty string when there are none.
  static String reviewCount(int count) => switch (count) {
    <= 0 => '',
    1 => '1 review',
    _ => '$count reviews',
  };
}
