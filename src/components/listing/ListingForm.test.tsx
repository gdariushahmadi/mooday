import { describe, it, expect, beforeEach, vi, beforeAll } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ListingForm } from "./ListingForm";
import type { Product } from "@/context/AppContext";

// Mocks
const mockUser = {
  nameEn: "John Doe",
  nameAr: "جون دو",
  avatar: "/avatar.jpg",
  typeEn: "Verified",
  typeAr: "موثق",
};

const defaultProps = {
  isAr: false,
  onSubmit: vi.fn(),
  onCancel: vi.fn(),
  user: mockUser,
};

describe("ListingForm", () => {
  beforeAll(() => {
    // URL.createObjectURL might be called if we test file staging
    if (!global.URL.createObjectURL) {
      global.URL.createObjectURL = vi.fn(() => "blob:test");
    }
  });

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it("renders in English", () => {
    render(<ListingForm {...defaultProps} />);
    expect(screen.getByText("Title (English)")).toBeInTheDocument();
    expect(screen.getByText("Title (Arabic)")).toBeInTheDocument();
    expect(screen.getByText("Publish listing")).toBeInTheDocument();
  });

  it("renders in Arabic", () => {
    render(<ListingForm {...defaultProps} isAr={true} />);
    expect(screen.getByText("العنوان (إنجليزي)")).toBeInTheDocument();
    expect(screen.getByText("العنوان (عربي)")).toBeInTheDocument();
    expect(screen.getByText("نشر المنتج")).toBeInTheDocument();
  });

  it("initializes with empty values for create mode", () => {
    render(<ListingForm {...defaultProps} />);
    const enTitleInput = screen.getByText("Title (English)").parentElement?.querySelector("input");
    expect(enTitleInput).toHaveValue("");
  });

  it("initializes with existing values for edit mode", () => {
    const initialProduct: Partial<Product> = {
      titleEn: "Vintage Jacket",
      price: 150,
      descriptionEn: "A nice jacket",
    };
    render(<ListingForm {...defaultProps} initial={initialProduct} />);
    const enTitleInput = screen.getByText("Title (English)").parentElement?.querySelector("input");
    expect(enTitleInput).toHaveValue("Vintage Jacket");

    const priceInput = screen.getByText("Your price (AED)").parentElement?.querySelector("input");
    expect(priceInput).toHaveValue(150);

    const descInput = screen.getByText("Description (English)").parentElement?.querySelector("textarea");
    expect(descInput).toHaveValue("A nice jacket");
  });

  it("shows validation error if required fields are missing on submit", async () => {
    const user = userEvent.setup();
    render(<ListingForm {...defaultProps} />);

    await user.click(screen.getByRole("button", { name: "Publish listing" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Please complete the required fields.");
    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it("successfully submits with correct data", async () => {
    const user = userEvent.setup();
    const onSubmitMock = vi.fn();
    render(<ListingForm {...defaultProps} onSubmit={onSubmitMock} />);

    const titleInput = screen.getByText("Title (English)").parentElement?.querySelector("input");
    await user.type(titleInput!, "My Cool Item");

    const priceInput = screen.getByText("Your price (AED)").parentElement?.querySelector("input");
    await user.type(priceInput!, "500");

    await user.click(screen.getByRole("button", { name: "Publish listing" }));

    expect(onSubmitMock).toHaveBeenCalledTimes(1);
    expect(onSubmitMock).toHaveBeenCalledWith(expect.objectContaining({
      titleEn: "My Cool Item",
      price: 500,
      sellerNameEn: "John Doe",
    }));
  });

  it("calculates and displays discount percentage", async () => {
    const user = userEvent.setup();
    render(<ListingForm {...defaultProps} />);

    const priceInput = screen.getByText("Your price (AED)").parentElement?.querySelector("input");
    await user.type(priceInput!, "50");

    const retailInput = screen.getByText("Retail price (AED, for discount %)").parentElement?.querySelector("input");
    await user.type(retailInput!, "100");

    expect(screen.getByText(/Discount %: 50%/i)).toBeInTheDocument();
  });

  it("calls onSaveDraft and bypasses validation", async () => {
    const user = userEvent.setup();
    const onSaveDraftMock = vi.fn();

    render(<ListingForm {...defaultProps} onSaveDraft={onSaveDraftMock} />);

    await user.click(screen.getByRole("button", { name: "Save as draft" }));

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(onSaveDraftMock).toHaveBeenCalledTimes(1);
  });

  it("autosaves to localStorage and restores", async () => {
    const { unmount } = render(<ListingForm {...defaultProps} draftKey="test_draft" />);

    const titleInput = screen.getByText("Title (English)").parentElement?.querySelector("input");
    const user = userEvent.setup();
    await user.type(titleInput!, "Draft Title");

    unmount();

    const draftContent = localStorage.getItem("test_draft");
    expect(draftContent).toContain("Draft Title");

    render(<ListingForm {...defaultProps} draftKey="test_draft" />);
    const newTitleInput = screen.getByText("Title (English)").parentElement?.querySelector("input");
    expect(newTitleInput).toHaveValue("Draft Title");
  });

  it("clears draft after successful submit", async () => {
    const user = userEvent.setup();
    localStorage.setItem("test_draft", JSON.stringify({ titleEn: "Draft", price: "100" }));
    render(<ListingForm {...defaultProps} draftKey="test_draft" onSubmit={vi.fn()} />);

    const titleInput = screen.getByText("Title (English)").parentElement?.querySelector("input");
    expect(titleInput).toHaveValue("Draft");

    await user.click(screen.getByRole("button", { name: "Publish listing" }));

    expect(localStorage.getItem("test_draft")).toBeNull();
  });

  it("clears draft after save draft", async () => {
    const user = userEvent.setup();
    localStorage.setItem("test_draft_2", JSON.stringify({ titleEn: "Draft", price: "100" }));
    render(<ListingForm {...defaultProps} draftKey="test_draft_2" onSaveDraft={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Save as draft" }));

    expect(localStorage.getItem("test_draft_2")).toBeNull();
  });
});
