import 'package:event_tree/core/theme/page_theme.dart';
import 'package:event_tree/core/widgets/safe_network_image.dart';
import 'package:event_tree/data/models/profile.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// The top of a host's page: picture, name, handle, bio and socials.
///
/// Matches `apps/web/src/components/tree/ProfileHeader.tsx`, so the page
/// a host designed on the web reads the same here.
class HostHeader extends StatelessWidget {
  /// Draws [profile] in [theme], opening a social link through [onOpen].
  const new({
    required this.profile,
    required this.theme,
    required this.onOpen,
    super.key,
  });

  /// Whose page this is.
  final ProfileDto profile;

  /// The host's look.
  final PageTheme theme;

  /// Called with the URL of the social link tapped.
  final ValueChanged<String> onOpen;

  static const double _avatar = 96;

  @override
  Widget build(BuildContext context) {
    final name = profile.displayName.isNotEmpty
        ? profile.displayName
        : profile.username;
    return Column(
      children: [
        ClipOval(
          child: SizedBox(
            width: _avatar,
            height: _avatar,
            child: SafeNetworkImage(
              url: profile.avatarUrl,
              fallback: ColoredBox(
                color: theme.card,
                child: Center(
                  child: Text(
                    name.isEmpty ? '?' : name.substring(0, 1).toUpperCase(),
                    style: theme.textStyle(
                      size: 34,
                      weight: FontWeight.w800,
                      color: theme.cardText,
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Semantics(
          header: true,
          child: Text(
            name,
            textAlign: TextAlign.center,
            style: theme.textStyle(
              size: 26,
              weight: FontWeight.w800,
              height: 1.2,
              letterSpacing: -0.52,
            ),
          ),
        ),
        if (profile.username.isNotEmpty) ...[
          const SizedBox(height: 2),
          Text(
            '@${profile.username}',
            style: theme.textStyle(
              size: 15,
              weight: FontWeight.w600,
              color: theme.muted,
            ),
          ),
        ],
        if (profile.bio.isNotEmpty) ...[
          const SizedBox(height: 10),
          Text(
            profile.bio,
            textAlign: TextAlign.center,
            style: theme.textStyle(size: 15, height: 1.5),
          ),
        ],
        if (profile.socials.isNotEmpty) ...[
          const SizedBox(height: 16),
          Wrap(
            alignment: WrapAlignment.center,
            spacing: 6,
            runSpacing: 6,
            children: [
              for (final social in profile.socials)
                _Social(social: social, theme: theme, onOpen: onOpen),
            ],
          ),
        ],
      ],
    );
  }
}

/// One round glass chip with the platform's mark.
class _Social extends StatelessWidget {
  const new({required this.social, required this.theme, required this.onOpen});

  final SocialLinkDto social;
  final PageTheme theme;
  final ValueChanged<String> onOpen;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: social.platform.name,
      excludeSemantics: true,
      child: InkWell(
        onTap: social.url.isEmpty ? null : () => onOpen(social.url),
        customBorder: const CircleBorder(),
        child: Container(
          width: 44,
          height: 44,
          alignment: Alignment.center,
          child: Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: theme.glass,
              shape: BoxShape.circle,
            ),
            child: Icon(
              iconForPlatform(social.platform),
              size: 20,
              color: theme.text,
            ),
          ),
        ),
      ),
    );
  }
}

/// An icon for each platform a host can link to.
///
/// Lucide 4 dropped its brand marks, and shipping copies of other
/// companies' logos is a licensing question nobody needs, so each
/// platform gets the generic icon that says what the link *is*. The
/// platform's name is still read out: every chip carries it as its
/// semantic label.
IconData iconForPlatform(SocialPlatform platform) => switch (platform) {
  SocialPlatform.instagram => LucideIcons.camera,
  SocialPlatform.x => LucideIcons.messageSquare,
  SocialPlatform.linkedin => LucideIcons.briefcase,
  SocialPlatform.whatsapp => LucideIcons.messageCircle,
  SocialPlatform.youtube => LucideIcons.monitorPlay,
  SocialPlatform.tiktok => LucideIcons.music2,
  SocialPlatform.facebook => LucideIcons.thumbsUp,
  SocialPlatform.website => LucideIcons.globe,
};
