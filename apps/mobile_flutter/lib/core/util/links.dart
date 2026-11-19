import 'package:event_tree/core/config/env.dart';
import 'package:event_tree/core/router/app_router.dart';
import 'package:share_plus/share_plus.dart';
import 'package:url_launcher/url_launcher.dart';

/// Opening links, and sharing the web address of a page or event.
///
/// Shared links are always the **web** URLs (plan §1), so they work for
/// everyone, with or without the app. The app and the web app are served
/// from the same origin, so the address the app was built with is also
/// the one to share.
abstract final class Links {
  /// Opens [url] in the phone's browser or the matching app.
  ///
  /// Returns false when the URL is empty, malformed or nothing can open
  /// it, so the caller can say so rather than fail silently.
  static Future<bool> open(String url) async {
    final uri = Uri.tryParse(url.trim());
    if (uri == null || !uri.hasScheme || url.trim().isEmpty) return false;
    try {
      return await launchUrl(uri, mode: LaunchMode.externalApplication);
    } on Exception {
      return false;
    }
  }

  /// The web address of a host's page, or an empty string when this
  /// build has no server address.
  static String pageUrl(String username) {
    final root = Env.apiBaseUrl;
    return root.isEmpty ? '' : '$root${AppRoutes.page(username)}';
  }

  /// The web address of one event.
  static String eventUrl(String username, String slug) {
    final root = Env.apiBaseUrl;
    return root.isEmpty ? '' : '$root${AppRoutes.event(username, slug)}';
  }

  /// Hands [url] to the phone's share sheet, with [title] as the
  /// subject for apps that use one.
  static Future<void> share(String url, {String? title}) async {
    if (url.isEmpty) return;
    await SharePlus.instance.share(
      ShareParams(uri: Uri.parse(url), subject: title, title: title),
    );
  }
}
