import 'package:event_tree/core/theme/tokens.dart';
import 'package:event_tree/core/widgets/category_icon.dart';
import 'package:event_tree/data/models/community.dart';
import 'package:flutter/material.dart';

/// The horizontal row of category filters above the Discover feed.
///
/// Counts come from the server, so a chip is only offered when there is
/// something behind it. "All" clears the filter.
class CategoryChips extends StatelessWidget {
  /// Shows [categories], marking [selected], and reports taps through
  /// [onSelected] (an empty string means "All").
  const new({
    required this.categories,
    required this.selected,
    required this.onSelected,
    super.key,
  });

  /// The categories with at least one event, as the server counts them.
  final List<CategoryCountDto> categories;

  /// The chosen category, or an empty string for all of them.
  final String selected;

  /// Called with the category tapped, or an empty string for "All".
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      height: AppSpacing.touch,
      child: ListView.separated(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
        itemCount: categories.length + 1,
        separatorBuilder: (context, _) => const SizedBox(width: AppSpacing.sm),
        itemBuilder: (context, index) {
          if (index == 0) {
            return _Chip(
              label: 'All',
              chosen: selected.isEmpty,
              onTap: () => onSelected(''),
            );
          }
          final category = categories[index - 1];
          return _Chip(
            label: '${category.name}  ${category.count}',
            icon: iconForCategory(category.name),
            chosen: selected == category.name,
            onTap: () =>
                onSelected(selected == category.name ? '' : category.name),
          );
        },
      ),
    );
  }
}

/// One filter chip: white when chosen, a raised surface otherwise.
class _Chip extends StatelessWidget {
  const new({
    required this.label,
    required this.chosen,
    required this.onTap,
    this.icon,
  });

  final String label;
  final bool chosen;
  final VoidCallback onTap;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final icon = this.icon;
    final foreground = chosen ? AppColors.background : AppColors.text;
    return Semantics(
      button: true,
      selected: chosen,
      child: Material(
        color: chosen ? AppColors.text : AppColors.surfaceRaised,
        borderRadius: BorderRadius.circular(AppRadii.pill),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppRadii.pill),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.lg,
              vertical: AppSpacing.md,
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                if (icon != null) ...[
                  Icon(icon, size: 15, color: foreground),
                  const SizedBox(width: AppSpacing.xs + 2),
                ],
                Text(label, style: AppType.label.copyWith(color: foreground)),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
