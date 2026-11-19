import 'package:event_tree/core/widgets/safe_network_image.dart';
import 'package:event_tree/data/models/event.dart';
import 'package:flutter/material.dart';
import 'package:lucide_icons_flutter/lucide_icons.dart';

/// A full-screen look at the event photos, one swipe apart.
///
/// Always black behind the picture, whatever the host's colours are:
/// a photo reads best against nothing, and this is the one place in
/// the app where the picture is the whole point.
class PhotoViewer extends StatefulWidget {
  /// Shows [photos], opening at [startAt].
  const new({required this.photos, this.startAt = 0, super.key});

  /// Opens the viewer over the current screen.
  static Future<void> open(
    BuildContext context, {
    required List<ImageLinkDto> photos,
    int startAt = 0,
  }) => Navigator.of(context).push<void>(
    MaterialPageRoute<void>(
      fullscreenDialog: true,
      builder: (context) => PhotoViewer(photos: photos, startAt: startAt),
    ),
  );

  /// The pictures to page through.
  final List<ImageLinkDto> photos;

  /// Which one to open on.
  final int startAt;

  @override
  State<PhotoViewer> createState() => _PhotoViewerState();
}

class _PhotoViewerState extends State<PhotoViewer> {
  late final PageController _controller = PageController(
    initialPage: widget.startAt.clamp(0, _lastIndex),
  );
  late int _index = widget.startAt.clamp(0, _lastIndex);

  int get _lastIndex => widget.photos.isEmpty ? 0 : widget.photos.length - 1;

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final photos = widget.photos;
    final caption = photos.isEmpty ? '' : photos[_index].caption;
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.black,
        foregroundColor: Colors.white,
        leading: IconButton(
          icon: const Icon(LucideIcons.x),
          tooltip: 'Close',
          onPressed: Navigator.of(context).pop,
        ),
        title: photos.length > 1
            ? Text(
                '${_index + 1} of ${photos.length}',
                style: const TextStyle(fontSize: 15),
              )
            : null,
      ),
      body: Column(
        children: [
          Expanded(
            child: PageView.builder(
              controller: _controller,
              itemCount: photos.length,
              onPageChanged: (index) => setState(() => _index = index),
              itemBuilder: (context, index) => InteractiveViewer(
                maxScale: 4,
                child: Center(
                  child: SafeNetworkImage(
                    url: photos[index].url,
                    fit: BoxFit.contain,
                    semanticLabel: photos[index].alt.isEmpty
                        ? null
                        : photos[index].alt,
                    fallback: const ColoredBox(color: Colors.black),
                  ),
                ),
              ),
            ),
          ),
          if (caption.isNotEmpty)
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 12, 20, 28),
              child: Text(
                caption,
                textAlign: TextAlign.center,
                style: const TextStyle(color: Colors.white70, fontSize: 14),
              ),
            ),
        ],
      ),
    );
  }
}
