import { describe, it, expect } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { LegalDocumentView } from "./LegalDocumentView";
import { LEGAL_DOCUMENTS, TERMS, PRIVACY, REFUNDS } from "./content";

describe("Legal documents", () => {
  it("renders the terms with its heading, effective date, and sections", () => {
    render(<LegalDocumentView doc={TERMS} />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Terms of Service" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Effective: 24 August 2026/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: /Demo payments/ }),
    ).toBeInTheDocument();
  });

  it("switches the whole document to Arabic and flips direction", () => {
    const { container } = render(<LegalDocumentView doc={PRIVACY} />);

    expect(container.firstChild).toHaveAttribute("dir", "ltr");

    fireEvent.click(screen.getByRole("button", { name: "العربية" }));

    expect(
      screen.getByRole("heading", { level: 1, name: "سياسة الخصوصية" }),
    ).toBeInTheDocument();
    expect(container.firstChild).toHaveAttribute("dir", "rtl");
    expect(container.firstChild).toHaveAttribute("lang", "ar");
  });

  it("cross-links the three documents and marks the current one", () => {
    render(<LegalDocumentView doc={REFUNDS} />);

    const nav = screen.getByRole("navigation", { name: "Legal documents" });
    expect(within(nav).getByRole("link", { name: "Terms" })).toHaveAttribute(
      "href",
      "/legal/terms",
    );
    expect(within(nav).getByRole("link", { name: "Privacy" })).toHaveAttribute(
      "href",
      "/legal/privacy",
    );
    expect(
      within(nav).getByRole("link", { name: "Returns & Refunds" }),
    ).toHaveAttribute("aria-current", "page");
  });

  it.each(LEGAL_DOCUMENTS.map((doc) => [doc.slug, doc] as const))(
    "%s has matching section counts in both languages",
    (_slug, doc) => {
      expect(doc.ar.sections).toHaveLength(doc.en.sections.length);
      expect(doc.en.sections.length).toBeGreaterThan(0);
    },
  );

  it.each(LEGAL_DOCUMENTS.map((doc) => [doc.slug, doc] as const))(
    "%s has no empty headings in either language",
    (_slug, doc) => {
      for (const section of [...doc.en.sections, ...doc.ar.sections]) {
        expect(section.heading.trim()).not.toBe("");
        const hasBody =
          (section.paragraphs?.length ?? 0) > 0 ||
          (section.bullets?.length ?? 0) > 0;
        expect(hasBody).toBe(true);
      }
    },
  );
});
