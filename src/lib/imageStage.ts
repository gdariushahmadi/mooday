/**
 * Stage a local image file into a `blob:` URL the rest of the app can
 * treat as an ordinary image path.
 *
 * Mirrors the helper used by `ListingPhotoPicker`:
 *   - Validates mime against the `listing-media` bucket allow-list.
 *   - Validates size against the bucket cap.
 *   - Resizes images larger than the long-edge ceiling so the eventual
 *     upload stays predictable and tiny avatars do not blow up the
 *     network bill.
 *   - Emits a `URL.createObjectURL` that the caller can persist as a
 *     path. `isPublicImageUrl` already passes `blob:` URLs through, so
 *     the same read pipeline handles staged images and CDN URLs.
 */

export type ImageStageError =
  | { kind: "unsupported-type"; message: string }
  | { kind: "too-large"; message: string; limitMb: number };

export interface ImageStageOptions {
  allowedMime: readonly string[];
  maxBytes: number;
  maxLongEdgePx?: number;
}

export interface ImageStageResult {
  file: File;
  url: string;
  width: number;
  height: number;
}

function coerceMime(mime: string, allowed: readonly string[]): string | null {
  if (mime === "image/jpg") return "image/jpeg";
  return allowed.includes(mime) ? mime : null;
}

function loadFileAsImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("invalid image"));
    img.src = url;
  }).finally(() => {
    // Image has decoded; revoke on the next tick so the consumer can
    // copy pixels first.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  });
}

async function resizeToBlob(
  source: HTMLImageElement,
  maxLongEdge: number,
  mime: string,
): Promise<{ blob: Blob; width: number; height: number }> {
  const { naturalWidth, naturalHeight } = source;
  const longEdge = Math.max(naturalWidth, naturalHeight);
  const scale = longEdge > maxLongEdge ? maxLongEdge / longEdge : 1;
  const width = Math.max(1, Math.round(naturalWidth * scale));
  const height = Math.max(1, Math.round(naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("canvas 2d context unavailable");
  }
  ctx.drawImage(source, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mime, 0.9);
  });
  if (!blob) throw new Error("image resize failed");
  return { blob, width, height };
}

function tooLargeMessage(limitMb: number): string {
  return `Image is too large. Max size is ${limitMb.toFixed(0)} MB.`;
}

function unsupportedTypeMessage(): string {
  return "Unsupported image type. Use JPG, PNG, or WEBP.";
}

/**
 * Validate + resize a local image file. Throws `ImageStageError` on
 * failure; returns the staged `File` plus a `blob:` URL on success.
 */
export async function stageImage(
  file: File,
  options: ImageStageOptions,
): Promise<ImageStageResult> {
  const { allowedMime, maxBytes, maxLongEdgePx = 1600 } = options;
  const coerced = coerceMime(file.type, allowedMime);
  if (!coerced) {
    throw Object.assign(new Error(unsupportedTypeMessage()), {
      kind: "unsupported-type",
    }) as Error & Extract<ImageStageError, { kind: "unsupported-type" }>;
  }
  if (file.size > maxBytes) {
    const limitMb = maxBytes / (1024 * 1024);
    const err = new Error(tooLargeMessage(limitMb)) as Error &
      Extract<ImageStageError, { kind: "too-large" }>;
    err.kind = "too-large";
    err.limitMb = limitMb;
    throw err;
  }
  const image = await loadFileAsImage(file);
  const { blob, width, height } = await resizeToBlob(
    image,
    maxLongEdgePx,
    coerced,
  );
  const staged = new File([blob], file.name || "image", { type: coerced });
  const url = URL.createObjectURL(staged);
  return { file: staged, url, width, height };
}
