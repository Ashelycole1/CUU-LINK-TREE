import 'dart:async';

import 'package:event_tree/core/config/env.dart';
import 'package:event_tree/core/network/api_error.dart';
import 'package:event_tree/core/router/app_router.dart';
import 'package:event_tree/core/theme/tokens.dart';
import 'package:event_tree/data/providers/auth_providers.dart';
import 'package:event_tree/data/repositories/auth_repository.dart';
import 'package:event_tree/features/auth/presentation/widgets/auth_field.dart';
import 'package:event_tree/features/auth/presentation/widgets/auth_scaffold.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// Picking a handle at `/app/claim`. This is what creates the page.
///
/// The handle becomes the page's web address, so it is checked against
/// the server as it is typed rather than after the form is sent.
class ClaimUsernameScreen extends ConsumerStatefulWidget {
  /// Creates the claim screen.
  const new({super.key});

  @override
  ConsumerState<ClaimUsernameScreen> createState() =>
      _ClaimUsernameScreenState();
}

class _ClaimUsernameScreenState extends ConsumerState<ClaimUsernameScreen> {
  static const Duration _debounce = Duration(milliseconds: 400);

  final _username = TextEditingController();
  final _displayName = TextEditingController();
  Timer? _timer;
  bool _busy = false;
  bool? _available;
  String? _error;

  @override
  void dispose() {
    _timer?.cancel();
    _username.dispose();
    _displayName.dispose();
    super.dispose();
  }

  void _onTyped(String value) {
    _timer?.cancel();
    setState(() {
      _available = null;
      _error = null;
    });
    final handle = value.trim().toLowerCase();
    if (handle.length < 2) return;
    _timer = Timer(_debounce, () => unawaited(_check(handle)));
  }

  Future<void> _check(String handle) async {
    try {
      final result = await ref
          .read(authRepositoryProvider)
          .checkUsername(handle);
      if (!mounted || _username.text.trim().toLowerCase() != handle) return;
      setState(() {
        _available = result.available;
        _error = result.available || result.reason.isEmpty
            ? null
            : result.reason;
      });
    } on ApiError {
      // A failed check is not worth an error: the claim itself decides.
    }
  }

  Future<void> _submit() async {
    if (_busy) return;
    final handle = _username.text.trim().toLowerCase();
    if (handle.length < 2) {
      setState(() => _error = 'Pick a handle of at least 2 characters.');
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref
          .read(authProvider.notifier)
          .claimUsername(handle, displayName: _displayName.text.trim());
      if (mounted) context.go(AppRoutes.dashboard);
    } on ApiError catch (error) {
      if (!mounted) return;
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final origin = Env.apiBaseUrl.replaceFirst(RegExp('^https?://'), '');
    final handle = _username.text.trim().toLowerCase();
    return AuthScaffold(
      title: 'Pick your handle',
      subtitle:
          'It becomes your page address, and you share it everywhere. '
          'Short is better.',
      onBack: () => context.go(AppRoutes.profile),
      children: [
        AuthField(
          label: 'Handle',
          controller: _username,
          hint: 'gdg',
          inputFormatters: [
            FilteringTextInputFormatter.allow(RegExp('[a-zA-Z0-9_-]')),
          ],
          maxLength: 30,
          onChanged: _onTyped,
          onSubmitted: (_) => _submit(),
        ),
        if (handle.isNotEmpty) ...[
          _Preview(origin: origin, handle: handle, available: _available),
          const SizedBox(height: AppSpacing.lg),
        ],
        AuthField(
          label: 'Page title',
          controller: _displayName,
          hint: 'GDG Kampala',
          textCapitalization: TextCapitalization.words,
          onSubmitted: (_) => _submit(),
        ),
        AuthErrorNote(_error),
        FilledButton(
          onPressed: _busy || _available == false ? null : _submit,
          child: Text(_busy ? 'Creating your page…' : 'Create my page'),
        ),
      ],
    );
  }
}

/// The address the handle will produce, and whether it is free.
class _Preview extends StatelessWidget {
  const new({
    required this.origin,
    required this.handle,
    required this.available,
  });

  final String origin;
  final String handle;
  final bool? available;

  @override
  Widget build(BuildContext context) {
    final (icon, colour, text) = switch (available) {
      true => (LucideIcons.check, AppColors.success, 'is free'),
      false => (LucideIcons.x, AppColors.danger, 'is taken'),
      _ => (LucideIcons.link, AppColors.textSubtle, ''),
    };
    final where = origin.isEmpty ? handle : '$origin/$handle';
    return Row(
      children: [
        Icon(icon, size: 16, color: colour),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Text(
            text.isEmpty ? where : '$where $text',
            style: AppType.caption.copyWith(color: colour),
          ),
        ),
      ],
    );
  }
}
