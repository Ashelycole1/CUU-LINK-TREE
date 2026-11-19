import 'package:cached_network_image/cached_network_image.dart';
import 'package:event_tree/core/network/dio_provider.dart';
import 'package:event_tree/core/theme/tokens.dart';
import 'package:flutter/material.dart';

/// A network image that can never crash a screen (plan §7, rule 4).
///
/// It resolves `/media/...` paths against the API origin, caches what it
/// downloads, shows a quiet block while loading, and falls back to
/// [fallback] (or a muted icon) when the URL is empty or the download
/// fails. Students on mobile data see the fallback often, so it is part
/// of the design rather than an afterthought.
class SafeNetworkImage extends StatelessWidget {
  /// Shows [url], or [fallback] when there is nothing to show.
  const new({
    required this.url,
    this.fit = BoxFit.cover,
    this.width,
    this.height,
    this.fallback,
    this.semanticLabel,
    super.key,
  });

  /// An absolute URL or a `/media/...` path. Empty means no image.
  final String url;

  /// How the image fills its box.
  final BoxFit fit;

  /// The width to take, or null to fill the parent.
  final double? width;

  /// The height to take, or null to fill the parent.
  final double? height;

  /// Shown instead of the image when there is none or it fails.
  final Widget? fallback;

  /// Describes the image for screen readers. Null marks it decorative.
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) {
    final resolved = resolveMediaUrl(url);
    // Without an absolute address there is nothing to fetch: a relative
    // path in a build with no API_BASE_URL would only throw.
    if (!resolved.startsWith('http')) return _fallback();
    return CachedNetworkImage(
      imageUrl: resolved,
      fit: fit,
      width: width,
      height: height,
      fadeInDuration: AppMotion.fast,
      placeholder: (context, _) => _Block(width: width, height: height),
      errorWidget: (context, _, _) => _fallback(),
      imageBuilder: (context, provider) => Semantics(
        label: semanticLabel,
        image: true,
        excludeSemantics: semanticLabel != null,
        child: Image(image: provider, fit: fit, width: width, height: height),
      ),
    );
  }

  Widget _fallback() =>
      fallback ??
      _Block(
        width: width,
        height: height,
        child: const Icon(
          Icons.image_not_supported_outlined,
          color: AppColors.textSubtle,
          size: 20,
        ),
      );
}

/// The quiet surface shown while an image loads or when there is none.
class _Block extends StatelessWidget {
  const new({this.width, this.height, this.child});

  final double? width;
  final double? height;
  final Widget? child;

  @override
  Widget build(BuildContext context) {
    return ColoredBox(
      color: AppColors.surfaceRaised,
      child: SizedBox(
        width: width,
        height: height,
        child: Center(child: child),
      ),
    );
  }
}
