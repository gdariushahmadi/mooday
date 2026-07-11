"use client";

import React from "react";
import { useForcedMobile } from "@/hooks/useForcedMobile";
import { useAppNavigation } from "@/hooks/useAppNavigation";
import { AppContent } from "@/components/AppContent";

/**
 * Deep-link preview page.
 * Accepts query params so a specific view can be loaded via URL:
 *   /preview?view=search
 *   /preview?product=handbag-tan
 *   /preview?checkout=handbag-tan
 *   /preview?chat=chat-handbag-tan
 *
 * Designed to be used in iframes for marketing, stakeholder demos,
 * and embedding previews inside external documentation.
 *
 * Unlike the main app shell, this page renders no header or bottom nav —
 * it is meant to be embedded inside a phone frame at a fixed width.
 */
export default function PreviewPage() {
  // Force the app to render at a fixed mobile width when `?mobile=1` is set.
  useForcedMobile();

  const nav = useAppNavigation();

  return (
    <div className="min-h-dvh flex flex-col bg-background text-on-background antialiased">
      <main className="w-full max-w-container-max mx-auto px-margin-mobile md:px-lg mt-md flex-grow flex flex-col">
        <AppContent nav={nav} />
      </main>
    </div>
  );
}
