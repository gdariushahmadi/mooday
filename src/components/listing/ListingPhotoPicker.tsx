"use client";

import React, { useRef, useState } from "react";
import {
  LISTING_MEDIA_ALLOWED_MIME,
  LISTING_MEDIA_MAX_BYTES,
} from "@/services/backend";

/**
 * ListingPhotoPicker (Phase 3, slice 7).
 *
 * Replaces the round-robin mock image grid that ListingForm used during
 * Phase 1 with a real file picker that:
 *  - Validates mime against the `listing-media` bucket allow-list.
 *  - Validates size against the bucket's 10 MiB cap.
 *  - Resizes images larger than 1600px on the long edge so uploads stay
 *    under the cap and the network bill stays predictable.
 *  - Emits `object:` URLs that the form treats as ordinary image paths.
 *    `isPublicImageUrl` already passes `/`-prefixed and `blob:` URLs
 *    through verbatim so the backend reads them back unchanged.
 *
 * The picker intentionally does NOT upload to Supabase directly. The
 * upload happens when the user submits the form: AppContext.addListing
 * persists each photo URL via `media.upload(...)`. Keeping the picker
 * pure (no network on select) means the user can add, remove, and
 * reorder freely without churning the storage bucket.
 */
export interface PhotoPickerCopy {
  add: string;
  cover: string;
  removePhoto: (n: number) => string;
  moveBack: string;
  moveForward: string;
  dragHint: string;
  tooLarge: (limitMb: number) => string;
  unsupportedType: string;
  swapLast: string;
  orPickFromLibrary: string;
}

export interface ListingPhotoPickerProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  isAr: boolean;
  copy: PhotoPickerCopy;
  /** Mock library options for the dropdown fallback (Phase 1 demo data). */
  mockLibrary?: Array<{ name: string; url: string }>;
  /** Called when a freshly-selected file is staged. The URL emitted to
   * `onChange` is a `blob:` URL the caller can use as if it were an
   * image path. */
  onFileStage?: (file: File) => void;
  /** Override the long-edge pixel ceiling. Default 1600. */
  maxLongEdgePx?: number;
}

const MAX_LONG_EDGE_PX_DEFAULT = 1600;

interface ResizeResult {
  blob: Blob;
  width: number;
  height: number;
}

async function loadFileAsImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("invalid image"));
      img.src = url;
    });
  } finally {
    // The consumer reads pixels into a canvas below; revoke after the
    // Image element finishes decoding.
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

async function resizeToBlob(
  source: HTMLImageElement,
  maxLongEdge: number,
  mime: string,
): Promise<ResizeResult> {
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
  const blob: Blob | null = await new Promise((resolve) => {
    canvas.toBlob(resolve, mime, 0.9);
  });
  if (!blob) throw new Error("image resize failed");
  return { blob, width, height };
}

/**
 * Normalise the browser-supplied mime against the bucket allow-list.
 * iOS Safari in particular reports `image/jpg` for JPEGs; we coerce
 * before validation so the user does not see a misleading rejection.
 */
function coerceMime(mime: string): string | null {
  if (mime === "image/jpg") return "image/jpeg";
  if ((LISTING_MEDIA_ALLOWED_MIME as readonly string[]).includes(mime)) {
    return mime;
  }
  return null;
}

export const ListingPhotoPicker: React.FC<ListingPhotoPickerProps> = ({
  photos,
  onChange,
  isAr,
  copy,
  mockLibrary,
  onFileStage,
  maxLongEdgePx = MAX_LONG_EDGE_PX_DEFAULT,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [staging, setStaging] = useState(false);

  const triggerPicker = () => {
    setError(null);
    inputRef.current?.click();
  };

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (photos.length >= 8) return;
    setStaging(true);
    setError(null);
    try {
      const next = [...photos];
      const remaining = 8 - next.length;
      const slice = Array.from(files).slice(0, remaining);
      for (const file of slice) {
        const coerced = coerceMime(file.type);
        if (!coerced) {
          setError(copy.unsupportedType);
          continue;
        }
        if (file.size > LISTING_MEDIA_MAX_BYTES) {
          setError(copy.tooLarge(LISTING_MEDIA_MAX_BYTES / (1024 * 1024)));
          continue;
        }
        // Pre-resize so the eventual `media.upload` call does not exceed
        // the bucket cap on hi-res phone shots.
        const image = await loadFileAsImage(file);
        const { blob } = await resizeToBlob(image, maxLongEdgePx, coerced);
        const staged = new File([blob], file.name || "photo", {
          type: coerced,
        });
        const url = URL.createObjectURL(staged);
        next.push(url);
        onFileStage?.(staged);
      }
      onChange(next);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isAr
            ? "تعذّر تحميل الصورة"
            : "Unable to stage image",
      );
    } finally {
      setStaging(false);
      // Reset the input so the same file can be re-picked.
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removePhoto = (idx: number) => {
    if (photos.length <= 1) return;
    onChange(photos.filter((_, i) => i !== idx));
  };

  const movePhoto = (idx: number, direction: -1 | 1) => {
    const destination = idx + direction;
    if (destination < 0 || destination >= photos.length) return;
    const next = [...photos];
    [next[idx], next[destination]] = [next[destination], next[idx]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-sm">
      <div className="flex gap-sm flex-wrap">
        {photos.map((url, idx) => (
          <div
            key={`${url}-${idx}`}
            className="relative w-24 h-24 rounded-lg overflow-hidden border border-surface-container-high"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt={`Photo ${idx + 1}`}
              src={url}
              className="w-full h-full object-cover"
            />
            {idx === 0 && (
              <span className="absolute top-1 start-1 text-[8px] uppercase tracking-wider bg-primary text-on-primary px-1.5 py-0.5 rounded font-bold">
                {copy.cover}
              </span>
            )}
            {photos.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => removePhoto(idx)}
                  aria-label={copy.removePhoto(idx + 1)}
                  className="absolute top-1 end-1 w-5 h-5 rounded-full bg-black/60 text-white text-[10px] flex items-center justify-center"
                >
                  ×
                </button>
                <div className="absolute inset-x-1 bottom-1 flex justify-between">
                  <button
                    type="button"
                    onClick={() => movePhoto(idx, -1)}
                    disabled={idx === 0}
                    aria-label={copy.moveBack}
                    className="w-6 h-6 rounded-full bg-black/60 text-white disabled:invisible"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={() => movePhoto(idx, 1)}
                    disabled={idx === photos.length - 1}
                    aria-label={copy.moveForward}
                    className="w-6 h-6 rounded-full bg-black/60 text-white disabled:invisible"
                  >
                    ›
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
        {photos.length < 8 && (
          <button
            type="button"
            onClick={triggerPicker}
            disabled={staging}
            aria-label={copy.add}
            className="w-24 h-24 rounded-lg border-2 border-dashed border-outline-variant flex flex-col items-center justify-center gap-1 text-outline hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
          >
            <span
              className="material-symbols-outlined text-[24px] no-mirror"
              aria-hidden="true"
            >
              {staging ? "hourglass_top" : "add_a_photo"}
            </span>
            <span className="text-[10px] uppercase tracking-wider">
              {staging ? (isAr ? "جارٍ المعالجة" : "Staging") : copy.add}
            </span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={LISTING_MEDIA_ALLOWED_MIME.join(",")}
        multiple
        capture="environment"
        onChange={(e) => void handleFiles(e.target.files)}
        className="sr-only"
        aria-hidden="true"
        tabIndex={-1}
      />

      {error && (
        <p role="alert" className="text-label-sm text-error" aria-live="polite">
          {error}
        </p>
      )}

      <p className="text-label-sm text-on-surface-variant">{copy.dragHint}</p>

      {mockLibrary && mockLibrary.length > 0 && photos.length < 8 && (
        <label className="text-label-sm flex flex-col gap-xs">
          <span className="text-on-surface-variant">
            {copy.orPickFromLibrary}
          </span>
          <select
            onChange={(e) => {
              if (!e.target.value) return;
              if (photos.length >= 8) return;
              onChange([...photos, e.target.value]);
              e.target.value = "";
            }}
            className="p-2 bg-surface border border-outline-variant rounded-lg"
            value=""
            aria-label={copy.swapLast}
          >
            <option value="">{copy.orPickFromLibrary}</option>
            {mockLibrary.map((opt) => (
              <option key={opt.url} value={opt.url}>
                {opt.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </div>
  );
};
