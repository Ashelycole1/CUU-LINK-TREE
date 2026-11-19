import 'dart:async';

import 'package:event_tree/core/theme/tokens.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// The search box above the Discover feed.
///
/// It waits a third of a second after the last key before asking the
/// server, so
/// typing "devfest" costs one request rather than seven. The timer and
/// the controller are both disposed (plan §7, rule 6).
class DiscoverSearchField extends StatefulWidget {
  /// Reports settled search text through [onSearch].
  const new({required this.onSearch, this.initialText = '', super.key});

  /// Called with the trimmed text once typing stops.
  final ValueChanged<String> onSearch;

  /// What the box starts with.
  final String initialText;

  @override
  State<DiscoverSearchField> createState() => _DiscoverSearchFieldState();
}

class _DiscoverSearchFieldState extends State<DiscoverSearchField> {
  static const Duration _debounce = Duration(milliseconds: 350);

  late final TextEditingController _controller = TextEditingController(
    text: widget.initialText,
  );
  Timer? _timer;

  @override
  void dispose() {
    _timer?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    _timer?.cancel();
    _timer = Timer(_debounce, () => widget.onSearch(value.trim()));
    setState(() {});
  }

  void _clear() {
    _timer?.cancel();
    _controller.clear();
    setState(() {});
    widget.onSearch('');
  }

  @override
  Widget build(BuildContext context) {
    return TextField(
      controller: _controller,
      onChanged: _onChanged,
      onSubmitted: (value) {
        _timer?.cancel();
        widget.onSearch(value.trim());
      },
      textInputAction: TextInputAction.search,
      keyboardType: TextInputType.text,
      style: AppType.body,
      decoration: InputDecoration(
        hintText: 'Find an event',
        prefixIcon: const Icon(
          LucideIcons.search,
          size: 20,
          color: AppColors.textSubtle,
        ),
        suffixIcon: _controller.text.isEmpty
            ? null
            : IconButton(
                onPressed: _clear,
                icon: const Icon(LucideIcons.x, size: 18),
                tooltip: 'Clear search',
              ),
      ),
    );
  }
}
