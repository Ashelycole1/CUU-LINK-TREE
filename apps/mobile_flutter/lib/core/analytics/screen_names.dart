/// Turning a location into a screen name fit for analytics.
///
/// A location carries a host's handle and an event's slug. Those are
/// public, but they are also somebody's data, and a funnel does not
/// need them: what matters is *which screen*, not whose. So every
/// location folds down to one of a dozen fixed names (plan §6).
library;

/// The screen name for [location], never containing a handle or slug.
///
/// Anything unrecognised reads as `other`, so a route added later
/// cannot leak a path by default.
String screenNameFor(String location) {
  final path = location.split('?').first.split('#').first;
  final fixed = _fixed[path];
  if (fixed != null) return fixed;
  final parts = path.split('/').where((part) => part.isNotEmpty).toList();
  return switch (parts.length) {
    1 => 'host_page',
    2 => 'event',
    _ => 'other',
  };
}

const Map<String, String> _fixed = {
  '/': 'discover',
  '/explore': 'discover',
  '/admin': 'dashboard',
  '/app/saved': 'saved',
  '/app/profile': 'profile',
  '/app/signin': 'sign_in',
  '/app/signup': 'sign_up',
  '/app/verify': 'verify_email',
  '/app/claim': 'claim_username',
  '/app/analytics': 'analytics_settings',
};
