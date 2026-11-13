/** What the API accepts (apps/api/src/infrastructure/media.ts). */
export const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
export const IMAGE_ACCEPT = IMAGE_TYPES.join(",");
const MAX_BYTES = 5 * 1024 * 1024;

/** Checks a picked file before uploading it; returns a message to show, or null. */
export function imageProblem(file: File): string | null {
  if (!IMAGE_TYPES.includes(file.type)) return "Choose a JPEG, PNG, GIF or WebP image.";
  if (file.size > MAX_BYTES) return "That image is over 5 MB. Choose a smaller one.";
  return null;
}
