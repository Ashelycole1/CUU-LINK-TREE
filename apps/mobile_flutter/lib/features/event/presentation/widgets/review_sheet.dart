import 'package:event_tree/core/theme/page_theme.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// What somebody typed into the review sheet.
@immutable
class ReviewDraft {
  /// Creates a draft.
  const new({required this.name, required this.rating, required this.comment});

  /// Who they said they were.
  final String name;

  /// One to five stars.
  final int rating;

  /// What they wrote, possibly nothing.
  final String comment;
}

/// The sheet for leaving a review.
///
/// A sheet rather than a screen: it is three fields, and keeping the
/// event behind it makes clear what is being reviewed. Pops with a
/// [ReviewDraft], or null when it is dismissed.
class ReviewSheet extends StatefulWidget {
  /// Opens the sheet for the event called [title].
  const new({required this.theme, required this.title, super.key});

  /// The host's look, so the sheet matches the page behind it.
  final PageTheme theme;

  /// What is being reviewed, shown at the top.
  final String title;

  @override
  State<ReviewSheet> createState() => _ReviewSheetState();
}

class _ReviewSheetState extends State<ReviewSheet> {
  final _name = TextEditingController();
  final _comment = TextEditingController();
  int _rating = 0;

  @override
  void dispose() {
    _name.dispose();
    _comment.dispose();
    super.dispose();
  }

  void _send() {
    if (_rating < 1) return;
    Navigator.of(context).pop(
      ReviewDraft(
        name: _name.text.trim().isEmpty ? 'Someone' : _name.text.trim(),
        rating: _rating,
        comment: _comment.text.trim(),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = widget.theme;
    return Padding(
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.viewInsetsOf(context).bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'How was it?',
            style: theme.textStyle(size: 22, weight: FontWeight.w800),
          ),
          const SizedBox(height: 2),
          Text(
            widget.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: theme.textStyle(size: 15, color: theme.muted),
          ),
          const SizedBox(height: 18),
          _Stars(
            rating: _rating,
            theme: theme,
            onChanged: (value) => setState(() => _rating = value),
          ),
          const SizedBox(height: 18),
          TextField(
            controller: _name,
            textCapitalization: TextCapitalization.words,
            style: theme.textStyle(size: 15),
            decoration: const InputDecoration(hintText: 'Your name'),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _comment,
            maxLines: 4,
            maxLength: 500,
            textCapitalization: TextCapitalization.sentences,
            style: theme.textStyle(size: 15),
            decoration: const InputDecoration(
              hintText: 'What stood out? (optional)',
            ),
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              TextButton(
                onPressed: () => Navigator.of(context).pop(),
                child: const Text('Cancel'),
              ),
              const Spacer(),
              FilledButton(
                onPressed: _rating < 1 ? null : _send,
                style: FilledButton.styleFrom(
                  backgroundColor: theme.accent,
                  foregroundColor: theme.onAccent,
                ),
                child: const Text('Post review'),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Five tappable stars.
class _Stars extends StatelessWidget {
  const new({
    required this.rating,
    required this.theme,
    required this.onChanged,
  });

  final int rating;
  final PageTheme theme;
  final ValueChanged<int> onChanged;

  @override
  Widget build(BuildContext context) => Row(
    children: [
      for (var star = 1; star <= 5; star++)
        Semantics(
          button: true,
          label: '$star star${star == 1 ? '' : 's'}',
          selected: rating == star,
          excludeSemantics: true,
          child: IconButton(
            onPressed: () => onChanged(star),
            iconSize: 30,
            icon: Icon(
              LucideIcons.star,
              color: star <= rating
                  ? theme.accent
                  : theme.text.withValues(alpha: 0.3),
            ),
          ),
        ),
    ],
  );
}
