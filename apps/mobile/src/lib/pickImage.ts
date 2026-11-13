import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";

export interface PickedImage {
  body: Blob;
  type: string;
  uri: string;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

/** Longest side, in pixels, for each kind of image. Larger photos are scaled down before upload. */
export const IMAGE_SIZES = { avatar: 640, poster: 1600, photo: 2048 } as const;

/**
 * Lets the person choose a photo from their library, then shrinks and
 * re-encodes it as a JPEG (quality 0.8) so uploads are small and fast on a
 * phone connection. GIFs are uploaded as they are, to keep their animation.
 * Returns null if they cancel; throws an Error with a readable message.
 */
export async function pickImage(options: { square?: boolean; maxSide?: number } = {}): Promise<PickedImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: !!options.square,
    aspect: options.square ? [1, 1] : undefined,
    quality: 1, // compressed once, below
    preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;

  const type = asset.mimeType ?? "image/jpeg";
  if (type === "image/gif") return read(asset.uri, type);
  if (!ACCEPTED.includes(type) && !type.startsWith("image/")) throw new Error("Choose a JPEG, PNG, GIF or WebP image.");

  const maxSide = options.maxSide ?? IMAGE_SIZES.photo;
  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > maxSide) {
    context.resize(asset.width >= asset.height ? { width: maxSide } : { height: maxSide });
  }
  const image = await context.renderAsync();
  try {
    const saved = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
    return read(saved.uri, "image/jpeg");
  } finally {
    image.release();
    context.release();
  }
}

async function read(uri: string, type: string): Promise<PickedImage> {
  const body = await (await fetch(uri)).blob();
  if (body.size > MAX_BYTES) throw new Error("That image is over 5 MB. Choose a smaller one.");
  return { body, type, uri };
}
