/**
 * Stock avatars offered to the user when no custom upload has been
 * staged. Sourced from the seller photos in /public/sellers/. Used by
 * `EditProfileView` so the picker can show every available option
 * instead of the original three hardcoded URLs.
 */
export interface AvatarOption {
  /** Stable id used in tests and event keys. */
  id: string;
  /** URL the avatar image is fetched from. */
  url: string;
  /** Short label shown next to the chip (optional, defaults to the id). */
  label?: string;
}

export const AVATAR_LIBRARY: AvatarOption[] = [
  { id: "fatima-almansoori", url: "/sellers/fatima-almansoori.jpg" },
  { id: "sarah", url: "/sellers/sarah.jpg" },
  { id: "layla", url: "/sellers/layla.jpg" },
  { id: "fatima", url: "/sellers/fatima.jpg" },
  { id: "amira", url: "/sellers/amira.jpg" },
  { id: "dalal", url: "/sellers/dalal.jpg" },
  { id: "hana", url: "/sellers/hana.jpg" },
  { id: "maha", url: "/sellers/maha.jpg" },
  { id: "mariam", url: "/sellers/mariam.jpg" },
  { id: "noor", url: "/sellers/noor.jpg" },
  { id: "rania", url: "/sellers/rania.jpg" },
  { id: "yasmin", url: "/sellers/yasmin.jpg" },
  { id: "zainab", url: "/sellers/zainab.jpg" },
];
