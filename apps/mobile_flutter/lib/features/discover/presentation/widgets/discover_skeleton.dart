import 'package:event_tree/core/theme/tokens.dart';
import 'package:flutter/material.dart';

/// Grey blocks in the shape of the Discover feed.
///
/// A first paint that is roughly the right shape reads as faster than a
/// spinner on an empty screen, which matters most on the slow
/// connections this app is built for.
class DiscoverSkeleton extends StatelessWidget {
  /// Creates the Discover placeholder.
  const new({super.key});

  @override
  Widget build(BuildContext context) => ListView(
    padding: const EdgeInsets.all(AppSpacing.lg),
    children: const [
      _Shimmer(height: 38, width: 180),
      SizedBox(height: AppSpacing.lg),
      _Shimmer(height: 48),
      SizedBox(height: AppSpacing.lg),
      _Shimmer(height: 36, width: 240),
      SizedBox(height: AppSpacing.xl),
      _Shimmer(height: 80),
      SizedBox(height: AppSpacing.md),
      _Shimmer(height: 80),
      SizedBox(height: AppSpacing.md),
      _Shimmer(height: 80),
    ],
  );
}

/// One quiet placeholder block.
class _Shimmer extends StatelessWidget {
  const new({required this.height, this.width});

  final double height;
  final double? width;

  @override
  Widget build(BuildContext context) => Container(
    height: height,
    width: width,
    decoration: BoxDecoration(
      color: AppColors.surface,
      borderRadius: BorderRadius.circular(AppRadii.md),
    ),
  );
}
