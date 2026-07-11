"use client";

import React, { useCallback, type KeyboardEvent } from "react";

interface ClickableCardProps {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  ariaLabel?: string;
  /** Render as a different element (e.g. "article" for semantic markup). */
  as?: "div" | "article";
}

/**
 * A click-able container that is fully keyboard accessible.
 *
 * Renders as a `div` (or `article`) with `role="button"`, `tabIndex={0}`
 * and `Enter`/`Space` keyboard activation, so it works for screen-reader
 * and keyboard users the same way a native `<button>` does.
 *
 * Use this for product cards and grid tiles where a real `<button>` would
 * be semantically wrong or hard to style as a card.
 */
export const ClickableCard: React.FC<ClickableCardProps> = ({
  children,
  onClick,
  className,
  ariaLabel,
  as = "div",
}) => {
  const Tag = as;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      // Enter and Space trigger the click on native buttons, but for
      // role="button" we have to implement it ourselves.
      if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        onClick();
      }
    },
    [onClick],
  );

  return (
    <Tag
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      aria-label={ariaLabel}
      className={className}
    >
      {children}
    </Tag>
  );
};
