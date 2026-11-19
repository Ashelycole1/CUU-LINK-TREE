import 'dart:async';

import 'package:event_tree/core/network/api_error.dart';
import 'package:event_tree/core/theme/page_theme.dart';
import 'package:event_tree/core/util/image_pick.dart';
import 'package:event_tree/core/widgets/safe_network_image.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:event_tree/data/providers/public_pages.dart';
import 'package:event_tree/features/event/application/event_providers.dart';
import 'package:event_tree/features/event/presentation/widgets/photo_viewer.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// The photos from an event, and a way to add one.
///
/// Anyone can add a photo — no account needed — which is how a past
/// event ends up with the pictures people actually took rather than
/// only the poster. Uploads are shrunk on the phone first (plan §1).
class EventGallery extends ConsumerStatefulWidget {
  /// Shows [event]'s gallery in [theme].
  const new({
    required this.event,
    required this.theme,
    required this.eventKey,
    super.key,
  });

  /// The event whose photos these are.
  final EventDto event;

  /// The host's look.
  final PageTheme theme;

  /// Which event this is, for re-reading it after an upload.
  final EventKey eventKey;

  @override
  ConsumerState<EventGallery> createState() => _EventGalleryState();
}

class _EventGalleryState extends ConsumerState<EventGallery> {
  bool _uploading = false;

  @override
  Widget build(BuildContext context) {
    final event = widget.event;
    final theme = widget.theme;
    final photos = event.gallery;
    // Before an event starts there is nothing to photograph.
    final canAdd = event.status != EventStatus.upcoming;
    if (photos.isEmpty && !canAdd) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 28),
        Row(
          children: [
            Semantics(
              header: true,
              child: Text(
                'Photos',
                style: theme.textStyle(size: 18, weight: FontWeight.w800),
              ),
            ),
            const Spacer(),
            if (canAdd)
              TextButton.icon(
                onPressed: _uploading ? null : () => unawaited(_add()),
                icon: Icon(
                  _uploading ? LucideIcons.loader : LucideIcons.imagePlus,
                  size: 16,
                  color: theme.text,
                ),
                label: Text(
                  _uploading ? 'Adding…' : 'Add a photo',
                  style: theme.textStyle(size: 14, weight: FontWeight.w700),
                ),
              ),
          ],
        ),
        const SizedBox(height: 10),
        if (photos.isEmpty)
          Text(
            'No photos yet. If you were there, add one.',
            style: theme.textStyle(size: 15, color: theme.muted),
          )
        else
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              mainAxisSpacing: 6,
              crossAxisSpacing: 6,
            ),
            itemCount: photos.length,
            itemBuilder: (context, index) => _Thumb(
              image: photos[index],
              theme: theme,
              onTap: () => unawaited(
                PhotoViewer.open(context, photos: photos, startAt: index),
              ),
            ),
          ),
      ],
    );
  }

  Future<void> _add() async {
    final messenger = ScaffoldMessenger.of(context);
    setState(() => _uploading = true);
    try {
      final picked = await ImagePick.fromGallery();
      if (picked == null) return;
      await uploadPhoto(
        ref,
        eventId: widget.event.id,
        key: widget.eventKey,
        bytes: picked.bytes,
        contentType: picked.contentType,
      );
      messenger
        ..clearSnackBars()
        ..showSnackBar(const SnackBar(content: Text('Photo added.')));
    } on ImageTooLargeException catch (error) {
      messenger
        ..clearSnackBars()
        ..showSnackBar(SnackBar(content: Text(error.message)));
    } on ApiError catch (error) {
      messenger
        ..clearSnackBars()
        ..showSnackBar(SnackBar(content: Text(error.message)));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }
}

/// One square in the grid.
class _Thumb extends StatelessWidget {
  const new({required this.image, required this.theme, required this.onTap});

  final ImageLinkDto image;
  final PageTheme theme;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Semantics(
    button: true,
    image: true,
    label: image.alt.isEmpty ? 'Event photo' : image.alt,
    excludeSemantics: true,
    child: GestureDetector(
      onTap: onTap,
      child: ClipRRect(
        borderRadius: BorderRadius.circular(8),
        child: SafeNetworkImage(
          url: image.url,
          fallback: ColoredBox(color: theme.cardWell),
        ),
      ),
    ),
  );
}
