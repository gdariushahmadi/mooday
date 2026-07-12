"use client";

import React, { useMemo, useState } from "react";
import { useApp, type Product } from "@/context/AppContext";
import { ClickableCard } from "./ClickableCard";
import { formatAEDLabel } from "@/lib/format";

/** Per-listing status for the closet view. Phase 1 derives this from
 * what we know about each listing — sold ones have matches in the
 * `orders` array, drafts have id prefixed `custom-` and a zero `saves`. */
type ClosetStatus = "active" | "sold" | "draft" | "reserved";

interface ClosetCopy {
  title: string;
  back: string;
  tabsAll: string;
  tabsActive: string;
  tabsSold: string;
  tabsDraft: string;
  filterAll: string;
  countLabel: (n: number) => string;
  bulkSelect: string;
  selectedLabel: (n: number) => string;
  bulkDelete: string;
  bulkMarkSold: string;
  cancel: string;
  discountPill: (pct: number) => string;
  editLabel: string;
  deleteLabel: string;
  markSoldLabel: string;
  statusActive: string;
  statusSold: string;
  statusDraft: string;
  statusReserved: string;
  emptyTitle: string;
  emptyBody: string;
  emptyCta: string;
}

const COPY: Record<"en" | "ar", ClosetCopy> = {
  en: {
    title: "My closet",
    back: "Back",
    tabsAll: "All",
    tabsActive: "Active",
    tabsSold: "Sold",
    tabsDraft: "Drafts",
    filterAll: "All",
    countLabel: (n) => `${n} item${n === 1 ? "" : "s"}`,
    bulkSelect: "Select multiple",
    selectedLabel: (n) => `${n} selected`,
    bulkDelete: "Delete",
    bulkMarkSold: "Mark as sold",
    cancel: "Cancel",
    discountPill: (pct) => `${pct}% off`,
    editLabel: "Edit",
    deleteLabel: "Delete",
    markSoldLabel: "Mark as sold",
    statusActive: "Active",
    statusSold: "Sold",
    statusDraft: "Draft",
    statusReserved: "Reserved",
    emptyTitle: "Your closet is empty",
    emptyBody:
      "Once you publish a listing, you'll find it here — plus bulk-edit tools and draft autosaves.",
    emptyCta: "List an item",
  },
  ar: {
    title: "خزانتي",
    back: "رجوع",
    tabsAll: "الكل",
    tabsActive: "نشطة",
    tabsSold: "مُباعة",
    tabsDraft: "مسودات",
    filterAll: "الكل",
    countLabel: (n) => `${n} منتج${n === 1 ? "" : "ات"}`,
    bulkSelect: "اختيار متعدد",
    selectedLabel: (n) => `${n} محدد`,
    bulkDelete: "حذف",
    bulkMarkSold: "تم البيع",
    cancel: "إلغاء",
    discountPill: (pct) => `${pct}٪ خصم`,
    editLabel: "تعديل",
    deleteLabel: "حذف",
    markSoldLabel: "تم البيع",
    statusActive: "نشط",
    statusSold: "مُباع",
    statusDraft: "مسودة",
    statusReserved: "محجوز",
    emptyTitle: "خزانتك فارغة",
    emptyBody:
      "بمجرد نشر منتج، ستجديه هنا — مع أدوات التعديل الجماعي وحفظ المسودات.",
    emptyCta: "أضيفي منتجاً",
  },
};

/** Derive a per-listing status heuristically. */
function deriveClosetStatus(
  product: Product,
  soldIds: Set<string>,
): ClosetStatus {
  if (soldIds.has(product.id)) return "sold";
  if (product.id.startsWith("custom-") && product.saves === 0) return "draft";
  // 4 reserved slots > saved but no orders — treat as a generic
  // "active"; real reserved status needs a bookings table.
  return "active";
}

interface MyClosetViewProps {
  onBack: () => void;
  onEditListing: (productId: string) => void;
  onCreateListing: () => void;
  onSelectProduct?: (product: Product) => void;
}

/**
 * D-20 — My Closet.
 *
 * The seller's view of their own listings, segmented by status
 * (Active · Sold · Draft · Reserved) with a bulk-select toolbar that
 * can mass-delete or mark-sold. Tapping an individual card opens
 * ProductDetailsView; tapping the card's pencil icon opens D-21 Edit
 * Listing. Tapping the card's trash icon removes the listing.
 */
export const MyClosetView: React.FC<MyClosetViewProps> = ({
  onBack,
  onEditListing,
  onCreateListing,
  onSelectProduct,
}) => {
  const { language, listings, removeListing, orders } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  const [tab, setTab] = useState<"all" | ClosetStatus>("all");
  const [bulkMode, setBulkMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Derive which product ids have a corresponding order (sold-to-someone).
  const soldIds = useMemo(() => {
    const ids = new Set<string>();
    for (const o of orders) {
      if (o.status === "cancelled") continue;
      for (const item of o.lineItems) ids.add(item.product.id);
    }
    return ids;
  }, [orders]);

  const closetListings = useMemo(() => {
    return listings
      .map((p) => ({ product: p, status: deriveClosetStatus(p, soldIds) }))
      .sort(
        (a, b) =>
          Number(b.product.id.startsWith("custom-")) -
            Number(a.product.id.startsWith("custom-")) ||
          b.product.saves - a.product.saves,
      );
  }, [listings, soldIds]);

  const filtered = useMemo(() => {
    if (tab === "all") return closetListings;
    return closetListings.filter(({ status }) => status === tab);
  }, [closetListings, tab]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const exitBulk = () => {
    setBulkMode(false);
    setSelected(new Set());
  };
  const handleBulkDelete = () => {
    selected.forEach((id) => removeListing(id));
    exitBulk();
  };

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="w-full flex flex-col gap-md">
      {/* Header */}
      <div className="flex items-center justify-between -mt-2">
        <button
          type="button"
          onClick={bulkMode ? exitBulk : onBack}
          aria-label={bulkMode ? t.cancel : t.back}
          className="flex items-center gap-1 text-primary active:scale-95 transition-transform py-1 pe-2"
        >
          <span
            className="material-symbols-outlined text-[22px] no-mirror"
            aria-hidden="true"
          >
            {bulkMode ? "close" : "arrow_back"}
          </span>
          {bulkMode && (
            <span className="text-label-sm font-bold uppercase tracking-wider">
              {t.cancel}
            </span>
          )}
        </button>
        <h1 className="font-serif text-label-lg text-on-surface tracking-widest">
          {bulkMode ? t.selectedLabel(selected.size) : t.title}
        </h1>
        {!bulkMode ? (
          <button
            type="button"
            onClick={() => setBulkMode(true)}
            className="text-label-sm text-primary font-bold active:scale-95 transition-transform"
          >
            {t.bulkSelect}
          </button>
        ) : (
          <div className="w-10" aria-hidden="true" />
        )}
      </div>

      {/* Tabs (only when not in bulk mode) */}
      {!bulkMode && (
        <div
          role="tablist"
          aria-label={isAr ? "تصفية حسب الحالة" : "Filter by status"}
          className="flex gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-margin-mobile px-margin-mobile"
        >
          {(
            [
              ["all", t.tabsAll],
              ["active", t.tabsActive],
              ["sold", t.tabsSold],
              ["draft", t.tabsDraft],
              ["reserved", t.statusReserved],
            ] as [typeof tab, string][]
          ).map(([id, label]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`flex-shrink-0 snap-start px-4 py-2 rounded-full text-label-sm uppercase tracking-wider transition-all border ${
                tab === id
                  ? "bg-primary text-on-primary border-primary font-bold"
                  : "bg-surface-container-lowest text-on-surface border-surface-container-high hover:bg-surface-container-high"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Bulk toolbar */}
      {bulkMode && selected.size > 0 && (
        <div className="flex items-center justify-end gap-sm">
          <button
            type="button"
            onClick={handleBulkDelete}
            className="px-3 py-2 rounded-full bg-red-100 text-red-900 text-label-sm font-bold uppercase tracking-wider active:scale-95 transition-transform"
          >
            {t.bulkDelete} ({selected.size})
          </button>
        </div>
      )}

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-md text-center">
          <span
            className="material-symbols-outlined text-[64px] text-outline no-mirror"
            aria-hidden="true"
          >
            checkroom
          </span>
          <h2 className="font-serif text-headline-sm text-on-surface">
            {t.emptyTitle}
          </h2>
          <p className="text-label-sm text-on-surface-variant max-w-xs">
            {t.emptyBody}
          </p>
          <button
            type="button"
            onClick={onCreateListing}
            className="px-6 py-2 rounded-full bg-primary text-on-primary text-label-sm font-bold active:scale-95 transition-transform"
          >
            {t.emptyCta}
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-sm">
          {filtered.map(({ product, status }) => (
            <ClosetRow
              key={product.id}
              product={product}
              status={status}
              isAr={isAr}
              t={t}
              bulkMode={bulkMode}
              selected={selected.has(product.id)}
              onToggleSelect={() => toggleSelect(product.id)}
              onOpen={() =>
                bulkMode
                  ? toggleSelect(product.id)
                  : onSelectProduct
                    ? onSelectProduct(product)
                    : undefined
              }
              onEdit={() => onEditListing(product.id)}
              onDelete={() => removeListing(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

// ---------- Sub-components ----------

const STATUS_TONE: Record<ClosetStatus, string> = {
  active: "bg-emerald-100 text-emerald-900",
  sold: "bg-primary text-on-primary",
  draft: "bg-surface-container-high text-on-surface-variant",
  reserved: "bg-amber-100 text-amber-900",
};

const STATUS_LABEL: Record<ClosetStatus, keyof ClosetCopy> = {
  active: "statusActive",
  sold: "statusSold",
  draft: "statusDraft",
  reserved: "statusReserved",
};

/** Plain string map for rendering (avoids TS lookup of function props). */
const STATUS_PLAIN: Record<"en" | "ar", Record<ClosetStatus, string>> = {
  en: {
    active: "Active",
    sold: "Sold",
    draft: "Draft",
    reserved: "Reserved",
  },
  ar: {
    active: "نشط",
    sold: "مُباع",
    draft: "مسودة",
    reserved: "محجوز",
  },
};

const ClosetRow: React.FC<{
  product: Product;
  status: ClosetStatus;
  isAr: boolean;
  t: ClosetCopy;
  bulkMode: boolean;
  selected: boolean;
  onToggleSelect: () => void;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({
  product,
  status,
  isAr,
  t,
  bulkMode,
  selected,
  onToggleSelect,
  onOpen,
  onEdit,
  onDelete,
}) => {
  const productTitle = isAr ? product.titleAr : product.titleEn;
  const pct =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100,
        )
      : 0;

  return (
    <ClickableCard
      as="article"
      onClick={onOpen}
      ariaLabel={`${productTitle}, ${STATUS_PLAIN[isAr ? "ar" : "en"][status]}`}
      className={`flex gap-sm p-md bg-surface-container-lowest border rounded-xl hover:shadow-md transition-all relative ${
        selected
          ? "border-primary ring-2 ring-primary/20"
          : "border-surface-container-high"
      }`}
    >
      {bulkMode && (
        <span
          className={`absolute top-2 start-2 w-5 h-5 rounded border-2 flex items-center justify-center text-[12px] ${
            selected
              ? "bg-primary border-primary text-on-primary"
              : "bg-surface border-outline-variant"
          }`}
          aria-hidden="true"
        >
          {selected && "✓"}
        </span>
      )}
      <img
        alt={productTitle}
        src={product.image}
        className="w-16 h-16 rounded object-cover border border-outline-variant flex-shrink-0"
        loading="lazy"
      />
      <div className="flex-grow min-w-0">
        <div className="flex items-center gap-sm">
          <span
            className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${STATUS_TONE[status]}`}
          >
            {STATUS_PLAIN[isAr ? "ar" : "en"][status]}
          </span>
          {pct > 0 && (
            <span className="text-[10px] uppercase tracking-wider font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full">
              {t.discountPill(pct)}
            </span>
          )}
        </div>
        <h3 className="font-serif text-label-md text-on-surface line-clamp-1 mt-1">
          {productTitle}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-label-sm font-bold text-primary">
            {formatAEDLabel(product.price)}
          </span>
          <span className="text-[10px] text-outline">
            {isAr ? "حفظ" : "Saves"} {product.saves}
          </span>
        </div>
      </div>
      {!bulkMode && (
        <div className="flex flex-col gap-1 items-end justify-center">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            aria-label={t.editLabel}
            className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-primary active:scale-90 transition-transform"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              aria-hidden="true"
            >
              edit
            </span>
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={t.deleteLabel}
            className="w-8 h-8 rounded-full bg-surface-container-low flex items-center justify-center text-red-700 active:scale-90 transition-transform"
          >
            <span
              className="material-symbols-outlined text-[18px]"
              aria-hidden="true"
            >
              delete
            </span>
          </button>
        </div>
      )}
    </ClickableCard>
  );
};
