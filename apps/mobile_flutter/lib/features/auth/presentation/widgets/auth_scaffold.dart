import 'package:event_tree/core/router/app_router.dart';
import 'package:event_tree/core/theme/tokens.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// The shape every account screen takes: a back arrow, a big title, a
/// line saying why, then the form.
///
/// One layout for all four steps means sign-up, the emailed code and
/// claiming a username read as one flow rather than three screens
/// borrowed from different apps.
class AuthScaffold extends StatelessWidget {
  /// Builds an account screen titled [title].
  const new({
    required this.title,
    required this.subtitle,
    required this.children,
    this.onBack,
    super.key,
  });

  /// The big heading.
  final String title;

  /// One line under it saying what this step is for.
  final String subtitle;

  /// The form.
  final List<Widget> children;

  /// What Back does, when it should not simply pop.
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(LucideIcons.arrowLeft),
          tooltip: 'Back',
          onPressed:
              onBack ??
              () {
                if (context.canPop()) {
                  context.pop();
                } else {
                  context.go(AppRoutes.profile);
                }
              },
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg,
            AppSpacing.sm,
            AppSpacing.lg,
            AppSpacing.xxl,
          ),
          children: [
            Semantics(header: true, child: Text(title, style: AppType.display)),
            const SizedBox(height: AppSpacing.sm),
            Text(
              subtitle,
              style: AppType.body.copyWith(color: AppColors.textMuted),
            ),
            const SizedBox(height: AppSpacing.xl),
            ...children,
          ],
        ),
      ),
    );
  }
}

/// The red line under a form when the server turned it down.
class AuthErrorNote extends StatelessWidget {
  /// Shows [message], or nothing when it is null.
  const new(this.message, {super.key});

  /// What went wrong, already in the app's own words.
  final String? message;

  @override
  Widget build(BuildContext context) {
    final message = this.message;
    if (message == null || message.isEmpty) return const SizedBox.shrink();
    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Padding(
            padding: EdgeInsets.only(top: 2),
            child: Icon(
              LucideIcons.circleAlert,
              size: 16,
              color: AppColors.danger,
            ),
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Text(
              message,
              style: AppType.body.copyWith(color: AppColors.danger),
            ),
          ),
        ],
      ),
    );
  }
}
