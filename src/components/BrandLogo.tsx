import React from "react";
import Image from "next/image";

/**
 * Reusable DANEG brand logo.
 *
 * Renders one of the SVGs staged under /public/brand/daneg/.
 * Pick the variant by background context:
 *   - orange-cream    orange mark + cream wordmark -> dark hero / video
 *   - orange-green    orange mark + green wordmark -> light surfaces (appbar)
 *   - mono-white      solid white                 -> dark or photo backgrounds
 *   - mono-black      solid black                 -> print / single-color
 *   - mark-orange     hex only, orange            -> accent badge
 *
 * `kind` picks a sensible default for the most common use.
 */

export type BrandLogoVariant =
  | "horizontal-orange-cream"
  | "horizontal-orange-green"
  | "horizontal-mono-black"
  | "horizontal-mono-white"
  | "vertical-orange-cream"
  | "vertical-orange-green"
  | "vertical-mono-black"
  | "vertical-mono-white"
  | "mark-orange"
  | "mark-orange-green"
  | "mark-silver"
  | "mark-black"
  | "mark-white";

const LOGO_ASPECT_RATIOS: Record<BrandLogoVariant, number> = {
  "horizontal-orange-cream": 244.7 / 44.6,
  "horizontal-orange-green": 244.7 / 44.6,
  "horizontal-mono-black": 238.6 / 48.7,
  "horizontal-mono-white": 238.6 / 48.7,
  "vertical-orange-cream": 143.3 / 92.3,
  "vertical-orange-green": 147.5 / 95,
  "vertical-mono-black": 109.6 / 76.3,
  "vertical-mono-white": 109.6 / 76.3,
  "mark-orange": 49 / 57,
  "mark-orange-green": 147.5 / 50,
  "mark-silver": 145.2 / 52,
  "mark-black": 109.6 / 44,
  "mark-white": 109.6 / 44,
};

interface BrandLogoProps {
  variant?: BrandLogoVariant;
  /** Render height in CSS pixels. Width auto-scales from the SVG aspect. */
  height?: number;
  className?: string;
  alt?: string;
  /** Override the default src (escape hatch for tests / previews). */
  src?: string;
}

export function BrandLogo({
  variant = "horizontal-orange-green",
  height = 28,
  className,
  alt = "DANEG",
  src,
}: BrandLogoProps) {
  const resolvedSrc = src ?? `/brand/daneg/daneg-${variant}.svg`;
  const width = Math.max(1, Math.round(height * LOGO_ASPECT_RATIOS[variant]));
  return (
    <Image
      src={resolvedSrc}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={{ height, width: "auto", display: "block" }}
      sizes={`${width}px`}
    />
  );
}
