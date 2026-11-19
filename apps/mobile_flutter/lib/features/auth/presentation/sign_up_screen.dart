import 'package:event_tree/core/network/api_error.dart';
import 'package:event_tree/core/router/app_router.dart';
import 'package:event_tree/core/theme/tokens.dart';
import 'package:event_tree/data/providers/auth_providers.dart';
import 'package:event_tree/features/auth/presentation/widgets/auth_field.dart';
import 'package:event_tree/features/auth/presentation/widgets/auth_scaffold.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

/// Creating a host account at `/app/signup`.
///
/// Two steps follow it: the emailed code, then claiming a username,
/// which is what actually creates the page.
class SignUpScreen extends ConsumerStatefulWidget {
  /// Creates the sign-up screen.
  const new({super.key});

  @override
  ConsumerState<SignUpScreen> createState() => _SignUpScreenState();
}

class _SignUpScreenState extends ConsumerState<SignUpScreen> {
  final _name = TextEditingController();
  final _email = TextEditingController();
  final _password = TextEditingController();
  bool _busy = false;
  String? _error;

  @override
  void dispose() {
    _name.dispose();
    _email.dispose();
    _password.dispose();
    super.dispose();
  }

  /// The three things the server would reject anyway, caught here so a
  /// phone on bad data does not spend a round trip finding out.
  String? _validate() {
    if (_name.text.trim().isEmpty) return 'Enter the name of your club.';
    if (!_email.text.trim().contains('@')) {
      return 'Enter a valid email address.';
    }
    if (_password.text.length < 8) {
      return 'Use at least 8 characters for your password.';
    }
    return null;
  }

  Future<void> _submit() async {
    if (_busy) return;
    final problem = _validate();
    if (problem != null) {
      setState(() => _error = problem);
      return;
    }
    setState(() {
      _busy = true;
      _error = null;
    });
    final email = _email.text.trim();
    try {
      final signedIn = await ref
          .read(authProvider.notifier)
          .signUp(
            email: email,
            password: _password.text,
            name: _name.text.trim(),
          );
      if (!mounted) return;
      context.go(
        signedIn
            ? AppRoutes.claimUsername
            : '${AppRoutes.verifyEmail}?email=$email',
      );
    } on ApiError catch (error) {
      if (!mounted) return;
      setState(() => _error = error.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AuthScaffold(
      title: 'Create a page',
      subtitle:
          'For clubs, faculties and the guild. One page, every event you '
          'post, one link to share.',
      children: [
        AutofillGroup(
          child: Column(
            children: [
              AuthField(
                label: 'Name',
                controller: _name,
                hint: 'GDG Kampala',
                textCapitalization: TextCapitalization.words,
                autofillHints: const [AutofillHints.organizationName],
              ),
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
                hint: 'At least 8 characters',
                obscure: true,
                autofillHints: const [AutofillHints.newPassword],
                onSubmitted: (_) => _submit(),
              ),
            ],
          ),
        ),
        AuthErrorNote(_error),
        FilledButton(
          onPressed: _busy ? null : _submit,
          child: Text(_busy ? 'Creating…' : 'Create account'),
        ),
        const SizedBox(height: AppSpacing.md),
        TextButton(
          onPressed: _busy ? null : () => context.go(AppRoutes.signIn),
          child: const Text('Already have one? Log in'),
        ),
      ],
    );
  }
}
