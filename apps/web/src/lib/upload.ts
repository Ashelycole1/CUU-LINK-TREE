/** What the API accepts (apps/api/src/infrastructure/media.ts). */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const IMAGE_ACCEPT = IMAGE_TYPES.join(",");
const MAX_BYTES = 5 * 1024 * 1024;

/** Longest side, in pixels, for each kind of image. Larger pictures are scaled down before upload. */
export const IMAGE_SIZES = { avatar: 640, header: 1600, poster: 1600, photo: 2048 } as const;

/** Checks a picked file's type before compressing it; returns a message to show, or null. */
export function imageProblem(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "Choose a JPEG, PNG, GIF or WebP image.";
  return null;
}

/**
 * Shrinks an image to `maxSide` pixels on its longest side and re-encodes
 * it as WebP (JPEG where the browser can't write WebP) at quality 0.82, so
 * a 6 MB phone photo uploads as a few hundred KB. GIFs keep their
 * animation and are sent as they are. If re-encoding would not make the
 * file smaller, the original is kept. Throws if the result is still over
 * the 5 MB limit.
 */
export async function compressImage(file: File, maxSide: number = IMAGE_SIZES.photo): Promise<Blob> {
  let out: Blob = file;
  if (file.type !== "image/gif") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(bitmap.width * scale);
      canvas.height = Math.round(bitmap.height * scale);
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
        bitmap.close();
        const encoded = (await toBlob(canvas, "image/webp")) ?? (await toBlob(canvas, "image/jpeg"));
        if (encoded && (scale < 1 || encoded.size < file.size)) out = encoded;
      }
    } catch {
      // The browser couldn't decode it; send the original and let the server check it.
    }
  }
  if (out.size > MAX_BYTES) throw new Error("That image is over 5 MB even after shrinking it. Choose a smaller one.");
  return out;
}

function toBlob(canvas: HTMLCanvasElement, type: string): Promise<Blob | null> {
  return new Promise((resolve) => canvas.toBlob((blob) => resolve(blob && blob.type === type ? blob : null), type, 0.82));
}
