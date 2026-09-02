import type { Metadata } from "next";
import { LegalDocumentView } from "../LegalDocumentView";
import { REFUNDS } from "../content";

export const metadata: Metadata = {
  title: REFUNDS.en.title,
  description: REFUNDS.en.summary,
  alternates: { canonical: "/legal/refunds" },
};

export default function RefundsPage() {
  return <LegalDocumentView doc={REFUNDS} />;
}
