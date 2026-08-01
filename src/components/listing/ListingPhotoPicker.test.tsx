import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ListingPhotoPicker } from "./ListingPhotoPicker";

const COPY_EN = {
  add: "Add",
  cover: "Cover",
  removePhoto: (n: number) => `Remove photo ${n}`,
  moveBack: "Move photo backward",
  moveForward: "Move photo forward",
  dragHint: "Up to 8 photos.",
  tooLarge: (mb: number) => `Max size is ${mb.toFixed(0)}MB.`,
  unsupportedType: "Unsupported image type.",
  swapLast: "Swap last photo",
  orPickFromLibrary: "Or pick from library...",
};

describe("ListingPhotoPicker (slice 7)", () => {
  it("renders a tile per existing photo plus an Add button", () => {
    render(
      <ListingPhotoPicker
        photos={["/products/a.jpg", "/products/b.jpg"]}
        onChange={() => {}}
        isAr={false}
        copy={COPY_EN}
      />,
    );
    expect(screen.getByAltText("Photo 1")).toHaveAttribute(
      "src",
      "/products/a.jpg",
    );
    expect(screen.getByAltText("Photo 2")).toHaveAttribute(
      "src",
      "/products/b.jpg",
    );
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
    // The cover badge only renders on the first tile.
    expect(screen.getByText("Cover")).toBeInTheDocument();
  });

  it("emits a new array when the library dropdown is used", () => {
    const onChange = vi.fn();
    render(
      <ListingPhotoPicker
        photos={["/products/a.jpg"]}
        onChange={onChange}
        isAr={false}
        copy={COPY_EN}
        mockLibrary={[
          { name: "Silk Scarf", url: "/products/silk-scarf.jpg" },
        ]}
      />,
    );
    const select = screen.getByRole("combobox", {
      name: /Swap last photo/i,
    }) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "/products/silk-scarf.jpg" } });
    expect(onChange).toHaveBeenCalledWith([
      "/products/a.jpg",
      "/products/silk-scarf.jpg",
    ]);
  });

  it("hides the Add button once 8 photos are staged", () => {
    render(
      <ListingPhotoPicker
        photos={Array.from({ length: 8 }, (_, i) => `/products/p${i}.jpg`)}
        onChange={() => {}}
        isAr={false}
        copy={COPY_EN}
      />,
    );
    expect(
      screen.queryByRole("button", { name: "Add" }),
    ).not.toBeInTheDocument();
  });

  it("does not allow removing the only photo (UX floor)", () => {
    render(
      <ListingPhotoPicker
        photos={["/products/only.jpg"]}
        onChange={() => {}}
        isAr={false}
        copy={COPY_EN}
      />,
    );
    expect(
      screen.queryByRole("button", { name: /Remove photo 1/i }),
    ).not.toBeInTheDocument();
  });
});
