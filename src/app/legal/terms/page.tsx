import type { Metadata } from "next";
import { LegalDocumentView } from "../LegalDocumentView";
import { TERMS } from "../content";

export const metadata: Metadata = {
  title: TERMS.en.title,
  description: TERMS.en.summary,
  alternates: { canonical: "/legal/terms" },
};

export default function TermsPage() {
  return <LegalDocumentView doc={TERMS} />;
}
