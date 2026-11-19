/// Build-time settings, passed with `--dart-define`.
///
/// ```sh
/// fvm flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000
/// ```
///
/// Nothing in the app hard-codes a server address: widgets and repositories
/// read it from here.
abstract final class Env {
  /// The Event Tree server's origin, the same one the web app uses
  /// (for example `https://eventtree.app`), without `/api/v1`.
  ///
  /// Empty when the build was made without `--dart-define=API_BASE_URL`.
  static String get apiBaseUrl => normalizeBaseUrl(_apiBaseUrl);

  /// Whether a server address was given at build time.
  static bool get hasApiBaseUrl => apiBaseUrl.isNotEmpty;

  /// The PostHog project key (phase 7). Empty means analytics stays off.
  static const String posthogKey = String.fromEnvironment('POSTHOG_KEY');

  /// The PostHog host, `https://us.i.posthog.com` or `https://eu.i.posthog.com`.
  static const String posthogHost = String.fromEnvironment(
    'POSTHOG_HOST',
    defaultValue: 'https://us.i.posthog.com',
  );

  static const String _apiBaseUrl = String.fromEnvironment('API_BASE_URL');

  /// Trims whitespace and trailing slashes, so `https://x.app/` and
  /// `https://x.app` build the same request URLs.
  static String normalizeBaseUrl(String raw) =>
      raw.trim().replaceFirst(RegExp(r'/+$'), '');
}
