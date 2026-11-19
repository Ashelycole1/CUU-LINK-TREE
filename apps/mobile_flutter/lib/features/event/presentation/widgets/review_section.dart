import 'dart:async';

import 'package:event_tree/core/network/api_error.dart';
import 'package:event_tree/core/theme/page_theme.dart';
import 'package:event_tree/core/util/format.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:event_tree/data/models/review.dart';
import 'package:event_tree/data/providers/public_pages.dart';
import 'package:event_tree/features/event/application/event_providers.dart';
import 'package:event_tree/features/event/presentation/widgets/rating_bars.dart';
import 'package:event_tree/features/event/presentation/widgets/review_sheet.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// What people thought: the rating, the reviews, and a way to add one.
///
/// Only shown once an event has started — that is the server's rule
/// (`acceptsReviews`), and the app follows it rather than guessing from
/// the clock.
class ReviewSection extends ConsumerWidget {
  /// Shows the reviews of [event] in [theme].
  const new({
    required this.event,
    required this.theme,
    required this.eventKey,
    super.key,
  });

  /// The event being reviewed.
  final EventDto event;

  /// The host's look.
  final PageTheme theme;

  /// Which event this is, for re-reading it after a review lands.
  final EventKey eventKey;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (!event.acceptsReviews && event.rating.count == 0) {
      return const SizedBox.shrink();
    }
    final reviews = ref.watch(eventReviewsProvider(event.id));
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 28),
        Semantics(
          header: true,
          child: Text(
            'Reviews',
            style: theme.textStyle(size: 18, weight: FontWeight.w800),
          ),
        ),
        const SizedBox(height: 14),
        if (event.rating.count > 0) ...[
          RatingBars(rating: event.rating, theme: theme),
          const SizedBox(height: 18),
        ] else
          Padding(
            padding: const EdgeInsets.only(bottom: 14),
            child: Text(
              'Nobody has reviewed this yet. Be the first.',
              style: theme.textStyle(size: 15, color: theme.muted),
            ),
          ),
        if (event.acceptsReviews)
          _WriteButton(
            theme: theme,
            onTap: () => unawaited(_write(context, ref)),
          ),
        reviews.when(
          loading: () => const Padding(
            padding: EdgeInsets.symmetric(vertical: 16),
            child: Center(child: CircularProgressIndicator()),
          ),
          error: (error, _) => Padding(
            padding: const EdgeInsets.only(top: 12),
            child: Text(
              ApiError.from(error).message,
              style: theme.textStyle(size: 14, color: theme.muted),
            ),
          ),
          data: (list) => Column(
            children: [
              for (final review in list) _Review(review: review, theme: theme),
            ],
          ),
        ),
      ],
    );
  }

  Future<void> _write(BuildContext context, WidgetRef ref) async {
    final messenger = ScaffoldMessenger.of(context);
    final result = await showModalBottomSheet<ReviewDraft>(
      context: context,
      isScrollControlled: true,
      backgroundColor: theme.background,
      builder: (context) => ReviewSheet(theme: theme, title: event.title),
    );
    if (result == null) return;
    try {
      await submitReview(
        ref,
        eventId: event.id,
        key: eventKey,
        authorName: result.name,
        rating: result.rating,
        comment: result.comment,
      );
      messenger
        ..clearSnackBars()
        ..showSnackBar(const SnackBar(content: Text('Thanks for that.')));
    } on ApiError catch (error) {
      messenger
        ..clearSnackBars()
        ..showSnackBar(SnackBar(content: Text(error.message)));
    }
  }
}

/// The button that opens the review sheet.
class _WriteButton extends StatelessWidget {
  const new({required this.theme, required this.onTap});

  final PageTheme theme;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Align(
      alignment: Alignment.centerLeft,
      child: OutlinedButton.icon(
        onPressed: onTap,
        icon: Icon(LucideIcons.penLine, size: 16, color: theme.text),
        label: Text(
          'Write a review',
          style: theme.textStyle(size: 15, weight: FontWeight.w700),
        ),
        style: OutlinedButton.styleFrom(
          side: BorderSide(color: theme.text.withValues(alpha: 0.4)),
        ),
      ),
    ),
  );
}

/// One review.
class _Review extends StatelessWidget {
  const new({required this.review, required this.theme});

  final ReviewDto review;
  final PageTheme theme;

  @override
  Widget build(BuildContext context) {
    final written = review.writtenOn;
    return Padding(
      padding: const EdgeInsets.only(top: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              for (var star = 1; star <= 5; star++)
                Icon(
                  LucideIcons.star,
                  size: 13,
                  color: star <= review.rating
                      ? theme.accent
                      : theme.text.withValues(alpha: 0.25),
                ),
              const SizedBox(width: 8),
              Flexible(
                child: Text(
                  review.authorName.isEmpty ? 'Someone' : review.authorName,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: theme.textStyle(size: 14, weight: FontWeight.w700),
                ),
              ),
              if (written.isNotEmpty) ...[
                const SizedBox(width: 8),
                Text(
                  written,
                  style: theme.textStyle(size: 12, color: theme.muted),
                ),
              ],
            ],
          ),
          if (review.comment.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              review.comment,
              style: theme.textStyle(size: 15, height: 1.45),
            ),
          ],
        ],
      ),
    );
  }
}

/// The wording for a count of reviews, shared with the facts list.
String reviewCountLabel(int count) => Format.reviewCount(count);
