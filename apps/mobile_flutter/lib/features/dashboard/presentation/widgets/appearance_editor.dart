import 'dart:async';

import 'package:event_tree/core/network/api_error.dart';
import 'package:event_tree/core/theme/page_theme.dart';
import 'package:event_tree/core/theme/tokens.dart';
import 'package:event_tree/core/util/image_pick.dart';
import 'package:event_tree/core/widgets/async_view.dart';
import 'package:event_tree/core/widgets/event_tile.dart';
import 'package:event_tree/core/widgets/safe_network_image.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:event_tree/data/models/profile.dart';
import 'package:event_tree/data/models/theme_preset.dart';
import 'package:event_tree/data/repositories/pages_repository.dart';
import 'package:event_tree/features/dashboard/application/dashboard_providers.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// Every theme a host can pick from.
final FutureProvider<List<ThemePresetDto>> themesProvider =
    FutureProvider<List<ThemePresetDto>>(
      (ref) => ref.watch(pagesRepositoryProvider).getThemes(),
    );

/// How a host's page looks: picture, theme and button shape.
///
/// Each choice is shown as the thing it produces — a real event button
/// in that style, a real swatch in those colours — rather than as a
/// name in a list, because nobody knows what "shadow" looks like until
/// they see it.
class AppearanceEditor extends ConsumerWidget {
  /// Creates the editor.
  const new({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profile = ref.watch(myProfileProvider);
    return AsyncView<ProfileDto>(
      value: profile,
      onRetry: () => ref.invalidate(myProfileProvider),
      data: (loaded) => _Editor(profile: loaded),
    );
  }
}

/// The loaded editor.
class _Editor extends ConsumerStatefulWidget {
  const new({required this.profile});

  final ProfileDto profile;

  @override
  ConsumerState<_Editor> createState() => _EditorState();
}

class _EditorState extends ConsumerState<_Editor> {
  bool _busy = false;
  String? _error;

  ProfileDto get _profile => widget.profile;

  @override
  Widget build(BuildContext context) {
    final themes = ref.watch(themesProvider);
    final theme = PageTheme.fromAppearance(_profile.appearance);
    return ListView(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.lg,
        0,
        AppSpacing.lg,
        AppSpacing.xxl,
      ),
      children: [
        _Avatar(
          url: _profile.avatarUrl,
          name: _profile.displayName,
          busy: _busy,
          onPick: () => unawaited(_pickAvatar()),
        ),
        const SizedBox(height: AppSpacing.xl),
        const _Heading('Theme'),
        themes.when(
          loading: () => const Padding(
            padding: EdgeInsets.all(AppSpacing.lg),
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (error, _) => Text(
            ApiError.from(error).message,
            style: AppType.caption.copyWith(color: AppColors.textMuted),
          ),
          data: (presets) => _Themes(
            presets: presets,
            selected: _profile.appearance.themeId,
            onPick: (preset) => unawaited(_apply({'themeId': preset.id})),
          ),
        ),
        const SizedBox(height: AppSpacing.xl),
        const _Heading('Button shape'),
        _Buttons(
          selected: _profile.appearance.buttonStyle,
          theme: theme,
          onPick: (style) => unawaited(_apply({'buttonStyle': style.wire})),
        ),
        const SizedBox(height: AppSpacing.xl),
        const _Heading('Font'),
        _Fonts(
          selected: _profile.appearance.font,
          theme: theme,
          onPick: (font) => unawaited(_apply({'font': font.wire})),
        ),
        if (_error != null) ...[
          const SizedBox(height: AppSpacing.lg),
          Text(_error!, style: AppType.body.copyWith(color: AppColors.danger)),
        ],
      ],
    );
  }

  Future<void> _apply(Map<String, dynamic> appearance) async {
    if (_busy) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(dashboardActionsProvider).updateProfile({
        'appearance': appearance,
      });
    } on ApiError catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _pickAvatar() async {
    setState(() => _busy = true);
    try {
      final picked = await ImagePick.fromGallery();
      if (picked == null) return;
      final actions = ref.read(dashboardActionsProvider);
      final url = await actions.uploadImage(
        bytes: picked.bytes,
        contentType: picked.contentType,
      );
      await actions.updateProfile({'avatarUrl': url});
    } on ImageTooLargeException catch (error) {
      if (mounted) setState(() => _error = error.message);
    } on ApiError catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }
}

/// The page picture.
class _Avatar extends StatelessWidget {
  const new({
    required this.url,
    required this.name,
    required this.busy,
    required this.onPick,
  });

  final String url;
  final String name;
  final bool busy;
  final VoidCallback onPick;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      ClipOval(
        child: SizedBox(
          width: 64,
          height: 64,
          child: SafeNetworkImage(
            url: url,
            fallback: ColoredBox(
              color: AppColors.surfaceRaised,
              child: Center(
                child: Text(
                  name.isEmpty ? '?' : name.substring(0, 1).toUpperCase(),
                  style: AppType.heading,
                ),
              ),
            ),
          ),
        ),
      ),
      const SizedBox(width: AppSpacing.lg),
      Expanded(
        child: OutlinedButton.icon(
          onPressed: busy ? null : onPick,
          icon: const Icon(LucideIcons.imagePlus, size: 16),
          label: const Text('Change picture'),
        ),
      ),
    ],
  );
}

/// The theme swatches.
class _Themes extends StatelessWidget {
  const new({
    required this.presets,
    required this.selected,
    required this.onPick,
  });

  final List<ThemePresetDto> presets;
  final String selected;
  final ValueChanged<ThemePresetDto> onPick;

  @override
  Widget build(BuildContext context) => Wrap(
    spacing: AppSpacing.md,
    runSpacing: AppSpacing.md,
    children: [
      for (final preset in presets)
        Semantics(
          button: true,
          selected: preset.id == selected,
          label: preset.name,
          excludeSemantics: true,
          child: GestureDetector(
            onTap: () => onPick(preset),
            child: Column(
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: parseHexColor(
                      preset.colors.background,
                      AppColors.surface,
                    ),
                    borderRadius: BorderRadius.circular(AppRadii.lg),
                    border: Border.all(
                      color: preset.id == selected
                          ? AppColors.text
                          : AppColors.border,
                      width: preset.id == selected ? 2 : 1,
                    ),
                  ),
                  child: Center(
                    child: Container(
                      width: 22,
                      height: 22,
                      decoration: BoxDecoration(
                        color: parseHexColor(
                          preset.colors.accent,
                          AppColors.accent,
                        ),
                        shape: BoxShape.circle,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.xs),
                SizedBox(
                  width: 60,
                  child: Text(
                    preset.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    textAlign: TextAlign.center,
                    style: AppType.caption.copyWith(color: AppColors.textMuted),
                  ),
                ),
              ],
            ),
          ),
        ),
    ],
  );
}

/// The four button shapes, each drawn as a real event button.
class _Buttons extends StatelessWidget {
  const new({
    required this.selected,
    required this.theme,
    required this.onPick,
  });

  final PageButtonStyle selected;
  final PageTheme theme;
  final ValueChanged<PageButtonStyle> onPick;

  static final EventDto _sample = EventDto(
    title: 'Your next event',
    venue: 'Main Hall',
    category: 'Tech',
    startsAt: DateTime.now()
        .add(const Duration(days: 7))
        .toUtc()
        .toIso8601String(),
    endsAt: DateTime.now()
        .add(const Duration(days: 7, hours: 2))
        .toUtc()
        .toIso8601String(),
  );

  @override
  Widget build(BuildContext context) => Column(
    children: [
      for (final style in PageButtonStyle.values)
        Padding(
          padding: const EdgeInsets.only(bottom: AppSpacing.md),
          child: Opacity(
            opacity: style == selected ? 1 : 0.6,
            child: EventTile(
              event: _sample,
              theme: PageTheme(
                background: theme.background,
                text: theme.text,
                card: theme.card,
                cardText: theme.cardText,
                accent: theme.accent,
                buttonStyle: style,
                fontFamily: theme.fontFamily,
              ),
              onTap: () => onPick(style),
            ),
          ),
        ),
    ],
  );
}

/// The three fonts, each set in itself.
class _Fonts extends StatelessWidget {
  const new({
    required this.selected,
    required this.theme,
    required this.onPick,
  });

  final PageFont selected;
  final PageTheme theme;
  final ValueChanged<PageFont> onPick;

  @override
  Widget build(BuildContext context) => RadioGroup<PageFont>(
    groupValue: selected,
    onChanged: (value) {
      if (value != null) onPick(value);
    },
    child: Column(
      children: [
        for (final font in PageFont.values)
          RadioListTile<PageFont>(
            value: font,
            contentPadding: EdgeInsets.zero,
            title: Text(
              font.family,
              style: TextStyle(
                fontFamily: font.family,
                fontSize: 17,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
      ],
    ),
  );
}

/// A section heading in the dashboard.
class _Heading extends StatelessWidget {
  const new(this.text);

  final String text;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: AppSpacing.md),
    child: Semantics(header: true, child: Text(text, style: AppType.heading)),
  );
}
