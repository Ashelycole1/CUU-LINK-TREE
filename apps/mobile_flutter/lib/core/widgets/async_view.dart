import 'package:event_tree/core/network/api_error.dart';
import 'package:event_tree/core/theme/tokens.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// Renders an [AsyncValue] with the three states every screen owes the
/// reader: loading, failed with a Retry, and loaded (plan §7, rule 3).
///
/// Empty results are the screen's own business, because only it knows
/// what "nothing here" means; use [EmptyState] for that.
class AsyncView<T> extends StatelessWidget {
  /// Shows [value], building [data] once it has loaded.
  const new({
    required this.value,
    required this.data,
    required this.onRetry,
    this.loading,
    super.key,
  });

  /// What to render.
  final AsyncValue<T> value;

  /// Builds the screen once the data is there.
  final Widget Function(T value) data;

  /// Called by the Retry button, and by pull-to-refresh above it.
  final VoidCallback onRetry;

  /// Shown while loading, instead of a centred spinner.
  final Widget? loading;

  @override
  Widget build(BuildContext context) {
    return value.when(
      skipLoadingOnRefresh: false,
      skipLoadingOnReload: true,
      data: data,
      loading: () =>
          loading ?? const Center(child: CircularProgressIndicator()),
      error: (error, _) =>
          ErrorRetry(error: ApiError.from(error), onRetry: onRetry),
    );
  }
}

/// What went wrong, in a sentence, with one obvious way forward.
class ErrorRetry extends StatelessWidget {
  /// Shows [error] and a Retry button that calls [onRetry].
  const new({required this.error, required this.onRetry, super.key});

  /// The failure, already mapped to a readable message.
  final ApiError error;

  /// Tries the request again.
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    final offline = error.isNetwork;
    return EmptyState(
      icon: offline ? LucideIcons.wifiOff : LucideIcons.circleAlert,
      heading: offline ? 'No connection' : 'That did not load',
      message: error.message,
      action: FilledButton(onPressed: onRetry, child: const Text('Retry')),
    );
  }
}

/// A centred icon, a heading, a sentence and an optional button.
///
/// Used for "nothing here yet" as well as for failures, so both read the
/// same way.
class EmptyState extends StatelessWidget {
  /// Describes the situation with an [icon], a [heading] and a [message].
  const new({
    required this.icon,
    required this.heading,
    required this.message,
    this.action,
    super.key,
  });

  /// A Lucide icon. Never an emoji (plan §4).
  final IconData icon;

  /// One short line, in sentence case.
  final String heading;

  /// One or two sentences saying what to do about it.
  final String message;

  /// An optional button under the message.
  final Widget? action;

  @override
  Widget build(BuildContext context) {
    final action = this.action;
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xl),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: AppSpacing.touch,
              height: AppSpacing.touch,
              decoration: BoxDecoration(
                color: AppColors.surfaceRaised,
                borderRadius: BorderRadius.circular(AppRadii.md),
              ),
              child: Icon(icon, color: AppColors.textMuted),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(heading, style: AppType.title, textAlign: TextAlign.center),
            const SizedBox(height: AppSpacing.xs),
            Text(
              message,
              textAlign: TextAlign.center,
              style: AppType.body.copyWith(color: AppColors.textMuted),
            ),
            if (action != null) ...[
              const SizedBox(height: AppSpacing.lg),
              action,
            ],
          ],
        ),
      ),
    );
  }
}
