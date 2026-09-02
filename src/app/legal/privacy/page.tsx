import type { Metadata } from "next";
import { LegalDocumentView } from "../LegalDocumentView";
import { PRIVACY } from "../content";

export const metadata: Metadata = {
  title: PRIVACY.en.title,
  description: PRIVACY.en.summary,
  alternates: { canonical: "/legal/privacy" },
};

export default function PrivacyPage() {
  return <LegalDocumentView doc={PRIVACY} />;
}
