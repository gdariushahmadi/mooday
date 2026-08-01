// Marketing landing — the entry point browsers hit on cold load.
// Reads `?lang=ar` to flip the document between English (LTR) and Arabic
// (RTL). The actual PWA / app shell lives at `/app`. Keep this file
// free of client-only state so the SEO / share preview is solid.

import type { Metadata } from "next";
import { Landing } from "@/components/landing/Landing";
import { COPY, type Lang } from "@/components/landing/copy";
import { DocumentDirSync } from "@/components/landing/DocumentDirSync";

interface PageProps {
  searchParams: Promise<{ lang?: string | string[] }>;
}

function coerceLang(raw: string | string[] | undefined): Lang {
  if (typeof raw === "string" && raw.toLowerCase().startsWith("ar")) return "ar";
  return "en";
}

export async function generateMetadata({
  searchParams,
}: PageProps): Promise<Metadata> {
  const params = await searchParams;
  const lang = coerceLang(params.lang);
  const t = COPY[lang];
  return {
    title: t.metaTitle,
    description: t.metaDescription,
    metadataBase: new URL(
      process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
    ),
    alternates: {
      canonical: "/",
      languages: {
        en: "/",
        ar: "/?lang=ar",
      },
    },
    openGraph: {
      title: t.metaTitle,
      description: t.metaDescription,
      url: "/",
      siteName: "Mooday",
      locale: lang === "ar" ? "ar_AE" : "en_AE",
      type: "website",
      images: [
        {
          url: "/landing/og-default.jpg",
          width: 1280,
          height: 720,
          alt: "Mooday — pre-loved fashion resale & rental",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t.metaTitle,
      description: t.metaDescription,
      images: ["/landing/og-default.jpg"],
    },
    robots: { index: true, follow: true },
  };
}

export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const lang = coerceLang(params.lang);
  return (
    <>
      <DocumentDirSync lang={lang} />
      <Landing lang={lang} />
    </>
  );
}
