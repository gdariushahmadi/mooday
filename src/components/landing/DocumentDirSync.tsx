"use client";

// Synces the `<html>` element's lang/dir on the client after hydration.
// This is needed because Next.js layouts set <html lang="en"> once and
// we can't change it from a server component on every query param flip.
// The page still renders correctly in SSR because the inner Landing
// <div> carries its own dir/lang attributes; this just keeps SEO tags
// and any full-document `::dir(...)` selectors consistent.

import { useEffect } from "react";
import type { Lang } from "./copy";

export function DocumentDirSync({ lang }: { lang: Lang }) {
  useEffect(() => {
    const root = document.documentElement;
    root.lang = lang;
    root.dir = lang === "ar" ? "rtl" : "ltr";
    document.cookie = `daneg_language=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }, [lang]);
  return null;
}
