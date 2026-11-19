import 'package:event_tree/core/auth/neon_auth_session.dart';
import 'package:event_tree/core/network/api_error.dart';
import 'package:event_tree/core/router/app_router.dart';
import 'package:event_tree/core/theme/tokens.dart';
import 'package:event_tree/data/providers/auth_providers.dart';
import 'package:event_tree/features/auth/presentation/widgets/auth_field.dart';
import 'package:event_tree/features/auth/presentation/widgets/auth_scaffold.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Logging in at `/app/signin`.
///
/// Only hosts need an account: students use the whole app without one
/// (plan §0). So this screen is reached from Profile, never pushed in
/// anyone's way.
class SignInScreen extends ConsumerStatefulWidget {
  /// Creates the log-in screen.
  const new({super.key});

  @override
  ConsumerState<SignInScreen> createState() => _SignInScreenState();
}

class _SignInScreenState extends ConsumerState<SignInScreen> {
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_busy) return;
    setState(() {
      _busy = true;
      _error = null;
    });
    try {
      await ref
          .read(authProvider.notifier)
          .signIn(email: _email.text.trim(), password: _password.text);
      if (!mounted) return;
      final auth = ref.read(authProvider).value;
      context.go(
        auth?.needsUsername ?? false
            ? AppRoutes.claimUsername
            : AppRoutes.dashboard,
      );
    } on ApiError catch (error) {
      if (!mounted) return;
      if (error.code == emailNotVerified) {
        context.go('${AppRoutes.verifyEmail}?email=${_email.text.trim()}');
        return;
      }
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Log in',
      subtitle: 'For hosts. Everything else works without an account.',
      children: [
        AutofillGroup(
          child: Column(
            children: [
              AuthField(
                label: 'Email',
                controller: _email,
                hint: 'you@cavendish.ac.ug',
                keyboardType: TextInputType.emailAddress,
                autofillHints: const [AutofillHints.email],
              ),
              AuthField(
                label: 'Password',
                controller: _password,
                obscure: true,
                autofillHints: const [AutofillHints.password],
                onSubmitted: (_) => _submit(),
              ),
            ],
          ),
        ),
        AuthErrorNote(_error),
        FilledButton(
          onPressed: _busy ? null : _submit,
          child: Text(_busy ? 'Logging in…' : 'Log in'),
        ),
        const SizedBox(height: AppSpacing.md),
        TextButton(
          onPressed: _busy ? null : () => context.go(AppRoutes.signUp),
          child: const Text('No account yet? Create one'),
        ),
      ],
    );
  }
}
