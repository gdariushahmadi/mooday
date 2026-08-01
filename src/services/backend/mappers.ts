/**
 * Mappers between the remote Phase 3 backend records (`ListingRecord`,
 * `SellerCardRecord`, `ListingImageRecord`) and the Phase 1 view model
 * (`Product`). Lives in its own module so the AppContext can swap the
 * source between mock and supabase without leaking supabase shapes into
 * the rest of the UI.
 *
 * The mapping is intentionally lossy in one direction: a `Product`
 * carries baked-in seller display fields (`sellerNameEn`, `sellerAvatar`,
 * etc.) for backwards compatibility with Phase 1 components that haven't
 * been refactored yet. Slice 3 derives those from `SellerCardRecord`
 * so the UI renders real seller data without each call site changing.
 */
import type { Product } from "@/context/AppContext";
import type {
  CreateListingInput,
  ListingImageRecord,
  ListingRecord,
  SellerCardRecord,
} from "./contracts";

const FALLBACK_PLACEHOLDER_IMAGE = "/products/placeholder.svg";

/** AED has 100 minor units per major (1 AED = 100 fils). */
const AED_MINOR_PER_MAJOR = 100;

export interface HydrateProductsInput {
  listings: ListingRecord[];
  sellerCardsById: Map<string, SellerCardRecord>;
  imagesByListingId: Map<string, ListingImageRecord[]>;
}

/**
 * Convert remote records into the Phase 1 `Product` view model. Falls back
 * to a placeholder avatar/image when remote data is missing so the UI
 * never crashes mid-hydration — Phase 3 seller cards are optional per
 * listing (a draft listing may have no public card yet, for instance).
 */
export function hydrateProductsFromRemote({
  listings,
  sellerCardsById,
  imagesByListingId,
}: HydrateProductsInput): Product[] {
  return listings.map((listing) => {
    const seller = sellerCardsById.get(listing.sellerId);
    const images = imagesByListingId.get(listing.id) ?? [];
    const primaryImage = images[0]?.url ?? FALLBACK_PLACEHOLDER_IMAGE;
    const allImages = images.length > 0
      ? images.map((i) => i.url)
      : [primaryImage];

    return {
      id: listing.id,
      titleEn: listing.titleEn,
      titleAr: listing.titleAr,
      price: listing.priceMinor / AED_MINOR_PER_MAJOR,
      originalPrice:
        (listing.originalPriceMinor ?? listing.priceMinor) /
        AED_MINOR_PER_MAJOR,
      conditionEn: listing.conditionEn,
      conditionAr: listing.conditionAr,
      sellerId: listing.sellerId,
      sellerNameEn: seller?.displayNameEn ?? "",
      sellerNameAr: seller?.displayNameAr ?? "",
      sellerAvatar: seller?.avatarUrl ?? "",
      sellerTypeEn: seller?.typeEn ?? "",
      sellerTypeAr: seller?.typeAr ?? "",
      // Active-listing volume is the closest proxy we have to a popularity
      // signal in Phase 3; the original `saves` field belongs to the
      // likes slice. Zero is fine until that slice lands.
      saves: seller?.listingsCount ?? 0,
      image: primaryImage,
      images: allImages,
      descriptionEn: listing.descriptionEn,
      descriptionAr: listing.descriptionAr,
      category: listing.category,
      isAuthentic: listing.isAuthentic,
      ...(listing.size !== null && { size: listing.size }),
      ...(listing.colorEn !== null && { colorEn: listing.colorEn }),
      ...(listing.colorAr !== null && { colorAr: listing.colorAr }),
      mode: listing.mode,
    };
  });
}

/**
 * Convert a Phase 1 `Product` form payload into the backend's create
 * payload. Splits seller-derived fields (the form carries them for
 * backwards compatibility) from listing-derived fields. Price is
 * converted to integer minor units (AED fils).
 */
export function mapProductToCreateInput(
  product: Pick<
    Product,
    | "titleEn"
    | "titleAr"
    | "price"
    | "originalPrice"
    | "conditionEn"
    | "conditionAr"
    | "descriptionEn"
    | "descriptionAr"
    | "category"
    | "isAuthentic"
    | "mode"
  > & {
    size?: string;
    colorEn?: string;
    colorAr?: string;
  },
  status: "draft" | "active" = "active",
): CreateListingInput {
  return {
    titleEn: product.titleEn,
    titleAr: product.titleAr,
    descriptionEn: product.descriptionEn ?? "",
    descriptionAr: product.descriptionAr ?? "",
    priceMinor: Math.max(0, Math.round(product.price * AED_MINOR_PER_MAJOR)),
    originalPriceMinor:
      product.originalPrice && product.originalPrice > product.price
        ? Math.round(product.originalPrice * AED_MINOR_PER_MAJOR)
        : null,
    currency: "AED",
    conditionEn: product.conditionEn,
    conditionAr: product.conditionAr,
    category: product.category,
    size: product.size ?? null,
    colorEn: product.colorEn ?? null,
    colorAr: product.colorAr ?? null,
    mode: product.mode ?? "resell",
    status,
    isAuthentic: product.isAuthentic ?? false,
  };
}

/** Strip readonly/derived fields for an update patch. */
export function mapProductToUpdatePatch(
  product: Partial<
    Pick<
      Product,
      | "titleEn"
      | "titleAr"
      | "price"
      | "originalPrice"
      | "conditionEn"
      | "conditionAr"
      | "descriptionEn"
      | "descriptionAr"
      | "category"
      | "isAuthentic"
      | "mode"
    > & {
      size?: string;
      colorEn?: string;
      colorAr?: string;
      status?: CreateListingInput["status"];
    }
  >,
): Partial<CreateListingInput> {
  const patch: Partial<CreateListingInput> = {};
  if (product.titleEn !== undefined) patch.titleEn = product.titleEn;
  if (product.titleAr !== undefined) patch.titleAr = product.titleAr;
  if (product.descriptionEn !== undefined)
    patch.descriptionEn = product.descriptionEn;
  if (product.descriptionAr !== undefined)
    patch.descriptionAr = product.descriptionAr;
  if (product.price !== undefined)
    patch.priceMinor = Math.max(0, Math.round(product.price * AED_MINOR_PER_MAJOR));
  if (product.originalPrice !== undefined)
    patch.originalPriceMinor =
      product.originalPrice && product.originalPrice > (product.price ?? 0)
        ? Math.round(product.originalPrice * AED_MINOR_PER_MAJOR)
        : null;
  if (product.conditionEn !== undefined) patch.conditionEn = product.conditionEn;
  if (product.conditionAr !== undefined) patch.conditionAr = product.conditionAr;
  if (product.category !== undefined) patch.category = product.category;
  if (product.size !== undefined) patch.size = product.size || null;
  if (product.colorEn !== undefined) patch.colorEn = product.colorEn || null;
  if (product.colorAr !== undefined) patch.colorAr = product.colorAr || null;
  if (product.mode !== undefined) patch.mode = product.mode;
  if (product.isAuthentic !== undefined) patch.isAuthentic = product.isAuthentic;
  if (product.status !== undefined) patch.status = product.status;
  return patch;
}

/**
 * Decide whether a stored `Product` photo path needs to be uploaded as a
 * real image (Phase 3 media bucket) or kept as a passthrough URL.
 *
 * Phase 1 mock image paths (`/products/foo.jpg`, `https://images.example/…`)
 * are public URLs that already work in the browser, so we persist them
 * verbatim in `listing_images.storage_path`. Real user uploads from a
 * future photo-picker UI will arrive as `Blob`/`File` objects and be
 * routed through `ListingMediaService.upload`.
 */
export function isPublicImageUrl(path: string): boolean {
  return path.startsWith("/") || /^https?:\/\//i.test(path);
}
