import * as ImagePicker from "expo-image-picker";

export interface PickedImage {
  body: Blob;
  type: string;
  uri: string;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

/**
 * Lets the person choose a photo from their library and reads it for upload.
 * Returns null if they cancel. iOS HEIC photos come back as JPEG, which the
 * API accepts. Throws an Error with a readable message for anything else.
 */
export async function pickImage(options: { square?: boolean } = {}): Promise<PickedImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: !!options.square,
    aspect: options.square ? [1, 1] : undefined,
    quality: 0.85,
    preferredAssetRepresentationMode: ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
  });
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;

  const type = asset.mimeType ?? "image/jpeg";
  if (!ACCEPTED.includes(type)) throw new Error("Choose a JPEG, PNG, GIF or WebP image.");
  if (asset.fileSize && asset.fileSize > MAX_BYTES) throw new Error("That image is over 5 MB. Choose a smaller one.");
  const body = await (await fetch(asset.uri)).blob();
  if (body.size > MAX_BYTES) throw new Error("That image is over 5 MB. Choose a smaller one.");
  return { body, type, uri: asset.uri };
}
