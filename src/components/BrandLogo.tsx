import React from "react";

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
  return (
    <img
      src={resolvedSrc}
      alt={alt}
      height={height}
      decoding="async"
      className={className}
      style={{ height, width: "auto", display: "block" }}
    />
  );
}
