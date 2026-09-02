"use client";

import { useState } from "react";
import Link from "next/link";
import type { LegalDocument } from "./content";
import { LEGAL_EFFECTIVE_DATE, LEGAL_ENTITY } from "./content";
import { BRAND, BRAND_AR } from "@/lib/brand";

const NAV = {
  en: [
    { slug: "terms", label: "Terms" },
    { slug: "privacy", label: "Privacy" },
    { slug: "refunds", label: "Returns & Refunds" },
  ],
  ar: [
    { slug: "terms", label: "الشروط" },
    { slug: "privacy", label: "الخصوصية" },
    { slug: "refunds", label: "الإرجاع والاسترداد" },
  ],
} as const;

const CHROME = {
  en: { back: "Back to DANEG", switch: "العربية" },
  ar: { back: "العودة إلى دانق", switch: "English" },
} as const;

interface LegalDocumentViewProps {
  doc: LegalDocument;
  /** Language the page opens in; the reader can switch at any time. */
  initialLang?: "en" | "ar";
}

/**
 * Shared shell for the three legal documents. Bilingual by the same
 * `COPY = { en, ar }` convention the app screens use, with the direction
 * flipped on the wrapper rather than on `document.documentElement` — these
 * pages sit outside the app shell and should not mutate global state.
 */
export function LegalDocumentView({
  doc,
  initialLang = "en",
}: LegalDocumentViewProps) {
  const [lang, setLang] = useState<"en" | "ar">(initialLang);
  const isAr = lang === "ar";
  const copy = doc[lang];
  const chrome = CHROME[lang];

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      lang={lang}
      className={`min-h-screen bg-background text-on-background antialiased ${
        isAr ? "font-arabic" : ""
      }`}
    >
      <header className="border-b border-outline-variant">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-5">
          <Link
            href="/"
            className="font-serif text-lg tracking-widest uppercase text-primary"
          >
            {isAr ? BRAND_AR : BRAND}
          </Link>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setLang(isAr ? "en" : "ar")}
              className="rounded-xl border border-outline-variant px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container-low transition"
            >
              {chrome.switch}
            </button>
            <Link
              href="/app"
              className="rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-on-primary hover:bg-primary/90 transition"
            >
              {chrome.back}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <nav aria-label={isAr ? "المستندات القانونية" : "Legal documents"}>
          <ul className="mb-10 flex flex-wrap gap-2">
            {NAV[lang].map((item) => {
              const isCurrent = item.slug === doc.slug;
              return (
                <li key={item.slug}>
                  <Link
                    href={`/legal/${item.slug}`}
                    aria-current={isCurrent ? "page" : undefined}
                    className={`inline-block rounded-full px-4 py-1.5 text-xs font-medium transition ${
                      isCurrent
                        ? "bg-primary text-on-primary"
                        : "border border-outline-variant text-on-surface-variant hover:bg-surface-container-low"
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <h1 className="font-serif text-3xl text-on-surface">{copy.title}</h1>
        <p className="mt-3 text-sm text-on-surface-variant">{copy.summary}</p>
        <p className="mt-1 text-xs text-on-surface-variant">
          {copy.effectiveLabel}: {LEGAL_EFFECTIVE_DATE[lang]}
        </p>

        <div className="mt-10 space-y-8">
          {copy.sections.map((section) => (
            <section key={section.heading}>
              <h2 className="text-base font-bold text-on-surface">
                {section.heading}
              </h2>
              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-3 text-sm leading-relaxed text-on-surface-variant"
                >
                  {paragraph}
                </p>
              ))}
              {section.bullets && (
                <ul
                  className={`mt-3 space-y-2 text-sm leading-relaxed text-on-surface-variant ${
                    isAr ? "pr-5" : "pl-5"
                  } list-disc`}
                >
                  {section.bullets.map((bullet) => (
                    <li key={bullet}>{bullet}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <footer className="mt-16 border-t border-outline-variant pt-6 text-xs text-on-surface-variant">
          <p>
            {isAr ? LEGAL_ENTITY.nameAr : LEGAL_ENTITY.nameEn} —{" "}
            {isAr ? LEGAL_ENTITY.jurisdictionAr : LEGAL_ENTITY.jurisdictionEn}
          </p>
          <p className="mt-1">{LEGAL_ENTITY.supportEmail}</p>
        </footer>
      </main>
    </div>
  );
}
