import 'dart:async';

import 'package:event_tree/core/theme/page_theme.dart';
import 'package:event_tree/core/theme/tokens.dart';
import 'package:event_tree/core/util/links.dart';
import 'package:event_tree/core/widgets/glass_button.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// Back and Share, floating over a host's background.
///
/// A host's page and an event both use it, so the host's colours reach
/// the top of the screen instead of stopping under an app bar. Before
/// the page has loaded [theme] is null and the buttons fall back to the
/// dark app palette.
class PageTopBar extends StatelessWidget {
  /// Shares [shareUrl], described as [shareLabel], and goes back to
  /// [fallbackLocation] when there is nothing to pop.
  const new({
    required this.shareUrl,
    required this.shareLabel,
    required this.fallbackLocation,
    this.theme,
    this.shareTitle,
    super.key,
  });

  /// The web address to hand to the share sheet. Empty hides Share.
  final String shareUrl;

  /// What the Share button does, for screen readers.
  final String shareLabel;

  /// Where Back goes when this screen was opened by a deep link.
  final String fallbackLocation;

  /// The host's look, or null while the page is loading.
  final PageTheme? theme;

  /// The subject some share targets show.
  final String? shareTitle;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.sm),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            GlassButton(
              icon: LucideIcons.arrowLeft,
              label: 'Back',
              theme: theme,
              onTap: () {
                if (context.canPop()) {
                  context.pop();
                } else {
                  context.go(fallbackLocation);
                }
              },
            ),
            if (shareUrl.isNotEmpty)
              GlassButton(
                icon: LucideIcons.share2,
                label: shareLabel,
                theme: theme,
                onTap: () =>
                    unawaited(Links.share(shareUrl, title: shareTitle)),
              ),
          ],
        ),
      ),
    );
  }
}
