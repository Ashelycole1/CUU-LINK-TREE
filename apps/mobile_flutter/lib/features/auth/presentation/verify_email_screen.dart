import 'package:event_tree/core/network/api_error.dart';
import 'package:event_tree/core/router/app_router.dart';
import 'package:event_tree/core/theme/tokens.dart';
import 'package:event_tree/data/providers/auth_providers.dart';
import 'package:event_tree/features/auth/presentation/widgets/auth_field.dart';
import 'package:event_tree/features/auth/presentation/widgets/auth_scaffold.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Entering the emailed sign-up code at `/app/verify`.
///
/// Codes last fifteen minutes, so "Send a new one" is on the screen
/// from the start rather than hidden behind a failure.
class VerifyEmailScreen extends ConsumerStatefulWidget {
  /// Checks the code sent to [email].
  const new({required this.email, super.key});

  /// The address the code went to.
  final String email;

  @override
  ConsumerState<VerifyEmailScreen> createState() => _VerifyEmailScreenState();
}

class _VerifyEmailScreenState extends ConsumerState<VerifyEmailScreen> {
  final _code = TextEditingController();
  bool _busy = false;
  String? _error;
  String? _note;

  @override
  void dispose() {
    _code.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_busy) return;
    setState(() {
      _busy = true;
      _error = null;
      _note = null;
    });
    try {
      await ref
          .read(authProvider.notifier)
          .verifyEmail(email: widget.email, otp: _code.text.trim());
      if (!mounted) return;
      final auth = ref.read(authProvider).value;
      context.go(
        auth?.needsUsername ?? true
            ? AppRoutes.claimUsername
            : AppRoutes.dashboard,
      );
    } on ApiError catch (error) {
      if (!mounted) return;
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _resend() async {
    if (_busy) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref.read(authProvider.notifier).resendCode(widget.email);
      if (mounted) setState(() => _note = 'A new code is on its way.');
    } on ApiError catch (error) {
      if (mounted) setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final note = _note;
    return AuthScaffold(
      title: 'Check your email',
      subtitle: 'We sent a code to ${widget.email}. It lasts 15 minutes.',
      children: [
        AuthField(
          label: 'Code',
          controller: _code,
          hint: '123456',
          keyboardType: TextInputType.number,
          maxLength: 6,
          inputFormatters: [FilteringTextInputFormatter.digitsOnly],
          autofillHints: const [AutofillHints.oneTimeCode],
          onSubmitted: (_) => _submit(),
        ),
        AuthErrorNote(_error),
        if (note != null)
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.md),
            child: Text(
              note,
              style: AppType.body.copyWith(color: AppColors.success),
            ),
          ),
        FilledButton(
          onPressed: _busy ? null : _submit,
          child: Text(_busy ? 'Checking…' : 'Confirm'),
        ),
        const SizedBox(height: AppSpacing.md),
        TextButton(
          onPressed: _busy ? null : _resend,
          child: const Text('Send a new code'),
        ),
      ],
    );
  }
}
