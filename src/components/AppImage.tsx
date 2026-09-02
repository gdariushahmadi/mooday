"use client";

import Image, { type ImageProps } from "next/image";

/**
 * Thin wrapper around `next/image` so every consumer in the app gets
 * the same memory/bandwidth defaults.
 *
 * Why a wrapper?
 *  - The site used to serve raw 864x1152 JPEGs everywhere, which
 *    decoded to ~4 MB of GPU memory per image and tipped mobile
 *    browsers past their per-tab memory budget (the "site hangs and
 *    force-stops after a few minutes" symptom). Routing every image
 *    through `/_next/image` returns an AVIF/WebP variant sized to
 *    the actual viewport slot, so cards on the home feed decode to
 *    roughly a tenth of the previous memory footprint.
 *  - The wrapper centralises `sizes` / `placeholder` behaviour so we
 *    don't have to repeat it on every consumer.
 *  - It handles local (`/products/...`) and remote (Supabase signed)
 *    URLs uniformly. Supabase storage is whitelisted in
 *    `next.config.ts#images.remotePatterns`.
 */
export interface AppImageProps extends Omit<ImageProps, "src" | "alt"> {
  src: string;
  alt: string;
  /**
   * Intrinsic image width in pixels. Required unless `fill` is set,
   * in which case the parent container controls sizing.
   */
  width?: number;
  /** Intrinsic image height in pixels. Required unless `fill` is set. */
  height?: number;
}

export function AppImage({
  src,
  alt,
  width,
  height,
  sizes = "100vw",
  loading,
  fetchPriority,
  priority,
  unoptimized,
  className,
  ...rest
}: AppImageProps) {
  const resolvedSrc = src || "/products/placeholder.svg";
  const isLocalPreview = resolvedSrc.startsWith("blob:") || resolvedSrc.startsWith("data:");
  // `priority` is Next.js's preloader-friendly shorthand for
  // `loading="eager" + fetchPriority="high"`. Setting `loading="lazy"`
  // at the same time trips a runtime validation error, so we resolve
  // the conflict here: if `priority` is on, default to eager; otherwise
  // default to lazy. Callers can still pass `loading` explicitly.
  const resolvedLoading =
    loading ?? (priority ? undefined : "lazy");
  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      loading={resolvedLoading}
      fetchPriority={fetchPriority}
      priority={priority}
      unoptimized={isLocalPreview || unoptimized}
      // Local object/data previews bypass the optimizer. Remote images use
      // the optimizer when their host is listed in `remotePatterns`.
      className={className}
      {...rest}
    />
  );
}
