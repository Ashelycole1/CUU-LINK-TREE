import 'dart:io';

import 'package:flutter/foundation.dart';
import 'package:flutter_image_compress/flutter_image_compress.dart';
import 'package:image_picker/image_picker.dart';

/// A picture chosen on the phone, ready to upload.
@immutable
class PickedImage {
  /// Creates a picked image.
  const new({required this.bytes, required this.contentType});

  /// The compressed bytes.
  final Uint8List bytes;

  /// What to send as `Content-Type`.
  final String contentType;

  /// Its size in kilobytes, for the "that is too big" message.
  int get kilobytes => (bytes.length / 1024).round();
}

/// Choosing a picture and getting it under the server's 5 MB limit.
///
/// A photo straight off a phone camera is routinely 4–8 MB, and these
/// students are on mobile data, so every upload is resized and
/// re-encoded as JPEG first: a 4000 px original becomes a few hundred
/// kilobytes with no visible loss at the sizes the app shows it.
abstract final class ImagePick {
  /// The server's ceiling (plan §1).
  static const int maxBytes = 5 * 1024 * 1024;

  /// Nothing the app shows is wider than this, so nothing needs to be.
  static const int maxEdge = 1600;

  /// The quality the first attempt uses.
  static const int quality = 82;

  /// Opens the photo library and returns a compressed JPEG, or null
  /// when nothing was chosen.
  ///
  /// Throws [ImageTooLargeException] when even a re-compressed copy is
  /// over [maxBytes], which only happens for enormous images.
  static Future<PickedImage?> fromGallery({ImagePicker? picker}) async {
    final file = await (picker ?? ImagePicker()).pickImage(
      source: ImageSource.gallery,
      maxWidth: maxEdge.toDouble(),
      maxHeight: maxEdge.toDouble(),
      imageQuality: quality,
    );
    if (file == null) return null;
    return await _compress(file.path);
  }

  static Future<PickedImage> _compress(String path) async {
    var bytes = await FlutterImageCompress.compressWithFile(
      path,
      minWidth: maxEdge,
      minHeight: maxEdge,
      quality: quality,
    );
    bytes ??= await File(path).readAsBytes();
    if (bytes.length > maxBytes) {
      // One harder pass before giving up.
      final smaller = await FlutterImageCompress.compressWithFile(
        path,
        minWidth: 1024,
        minHeight: 1024,
        quality: 60,
      );
      if (smaller != null) bytes = smaller;
    }
    if (bytes.length > maxBytes) {
      throw const ImageTooLargeException();
    }
    return PickedImage(bytes: bytes, contentType: 'image/jpeg');
  }
}

/// A picture that will not fit under the server's limit.
class ImageTooLargeException implements Exception {
  /// Creates the exception.
  const new();

  /// What to show the person.
  String get message =>
      'That picture is too big, even after shrinking. '
      'Try a different one.';

  @override
  String toString() => 'ImageTooLargeException: $message';
}
