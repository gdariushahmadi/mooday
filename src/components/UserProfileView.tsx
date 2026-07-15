"use client";

import React, { useState } from "react";
import { useApp, Product } from "@/context/AppContext";
import { ClickableCard } from "./ClickableCard";

interface UserProfileViewProps {
  onSelectProduct: (product: Product) => void;
  onOpenChat: (threadId: string) => void;
  /** Navigate to My Purchases (C-16). */
  onOpenPurchases?: () => void;
  /** Navigate to My Sales (D-22). */
  onOpenSales?: () => void;
  /** Navigate to Chats List (F-28). */
  onOpenChats?: () => void;
  /** Navigate to Saved Addresses (G-35). */
  onOpenAddresses?: () => void;
  /** Navigate to Saved Payment Methods (G-36). */
  onOpenPaymentMethods?: () => void;
  /** Navigate to Edit Profile (G-33). */
  onOpenEditProfile?: () => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  onSelectProduct,
  onOpenChat,
  onOpenPurchases,
  onOpenSales,
  onOpenChats,
  onOpenAddresses,
  onOpenPaymentMethods,
  onOpenEditProfile,
}) => {
  const {
    language,
    listings,
    likes,
    chats,
    orders,
    addresses: addressesFromContext,
    paymentMethods: paymentMethodsFromContext,
    userProfile,
  } = useApp();
  const isAr = language === "ar";

  const [activeTab, setActiveTab] = useState<
    "listings" | "likes" | "chats" | "rentals"
  >("listings");

  // User's custom created listings (for simplicity, we assume custom listings belong to this user)
  const userListings = listings.filter((item) => item.id.startsWith("custom-"));
  const likedItems = listings.filter((item) => likes.includes(item.id));

  return (
    <div className="w-full max-w-[1000px] mx-auto flex flex-col gap-lg pb-10">
      {/* Profile Card Header */}
      <section className="bg-surface-container-low border border-surface-container-high rounded-xl p-lg flex flex-col sm:flex-row items-center gap-lg shadow-sm relative">
        <img
          alt={isAr ? userProfile.fullNameAr : userProfile.fullNameEn}
          src={userProfile.avatar}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-primary-fixed-dim"
        />

        <div className="flex-grow flex flex-col items-center sm:items-start text-center sm:text-left gap-xs">
          <h2 className="font-serif text-headline-sm sm:text-headline-md text-on-surface">
            {isAr ? userProfile.fullNameAr : userProfile.fullNameEn}
          </h2>
          <p className="text-label-md text-primary font-bold">
            {userProfile.handle}
          </p>
          <p className="text-label-sm text-on-surface-variant flex items-center gap-1 mt-1 justify-center sm:justify-start">
            <span
              className="material-symbols-outlined text-[16px] text-primary"
              aria-hidden="true"
            >
              location_on
            </span>
            {isAr ? userProfile.locationAr : userProfile.locationEn}
          </p>

          {/* Review stars */}
          <div
            className="flex items-center gap-1 mt-2 justify-center sm:justify-start"
            aria-label={`${userProfile.rating} ${isAr ? "تقييم" : "stars"}`}
          >
            <div className="flex text-tertiary-container" aria-hidden="true">
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className="material-symbols-outlined text-[18px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  star
                </span>
              ))}
            </div>
            <span className="text-label-sm text-on-surface font-bold ml-1">
              {userProfile.rating}
            </span>
            <span className="text-[11px] text-on-surface-variant font-sans">
              ({userProfile.reviewsCount} {isAr ? "تقييم" : "reviews"})
            </span>
          </div>
        </div>

        {/* Stats segment */}
        <div className="flex gap-gutter border-t sm:border-t-0 sm:border-l border-surface-container-high pt-md sm:pt-0 sm:pl-gutter w-full sm:w-auto justify-around sm:justify-start font-sans">
          <div className="text-center">
            <span className="block text-headline-sm font-serif text-primary font-bold">
              {userListings.length}
            </span>
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">
              {isAr ? "معروض" : "Listings"}
            </span>
          </div>
          <div className="text-center">
            <span className="block text-headline-sm font-serif text-primary font-bold">
              {userProfile.followers}
            </span>
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">
              {isAr ? "متابع" : "Followers"}
            </span>
          </div>
          <div className="text-center">
            <span className="block text-headline-sm font-serif text-primary font-bold">
              {userProfile.following}
            </span>
            <span className="text-[11px] text-on-surface-variant uppercase tracking-wider">
              {isAr ? "يتابع" : "Following"}
            </span>
          </div>
        </div>
      </section>

      {/* Edit profile link */}
      {onOpenEditProfile && (
        <button
          type="button"
          onClick={onOpenEditProfile}
          className="self-end px-4 py-2 rounded-full bg-surface-container-low border border-surface-container-high text-label-sm text-on-surface font-bold uppercase tracking-wider hover:border-primary hover:text-primary transition-colors active:scale-95"
          aria-label={isAr ? "تعديل الملف" : "Edit profile"}
        >
          {isAr ? "تعديل الملف" : "Edit profile"}
        </button>
      )}

      {/* Quick action: My Purchases + Messages + Addresses + Payment Methods */}
      <div className="hidden">
        {onOpenPurchases && (
          <button
            type="button"
            onClick={onOpenPurchases}
            className="flex items-center justify-between gap-sm p-md bg-surface-container-lowest border border-surface-container-high rounded-xl hover:shadow-md transition-shadow active:scale-[0.99]"
            aria-label={isAr ? "مشترياتي" : "My purchases"}
          >
            <div className="flex items-center gap-sm">
              <span
                className="material-symbols-outlined text-[24px] text-primary no-mirror"
                aria-hidden="true"
              >
                package_2
              </span>
              <div className="text-start">
                <div className="font-serif text-label-sm text-on-surface">
                  {isAr ? "مشترياتي" : "Purchases"}
                </div>
                <div className="text-[10px] text-on-surface-variant">
                  {orders.length} {isAr ? "طلب" : "orders"}
                </div>
              </div>
            </div>
          </button>
        )}
        {onOpenChats && (
          <button
            type="button"
            onClick={onOpenChats}
            className="flex items-center justify-between gap-sm p-md bg-surface-container-lowest border border-surface-container-high rounded-xl hover:shadow-md transition-shadow active:scale-[0.99]"
            aria-label={isAr ? "الرسائل" : "Messages"}
          >
            <div className="flex items-center gap-sm">
              <span
                className="material-symbols-outlined text-[24px] text-primary no-mirror"
                aria-hidden="true"
              >
                chat_bubble
              </span>
              <div className="text-start">
                <div className="font-serif text-label-sm text-on-surface">
                  {isAr ? "الرسائل" : "Messages"}
                </div>
                <div className="text-[10px] text-on-surface-variant">
                  {chats.length} {isAr ? "محادثة" : "threads"}
                </div>
              </div>
            </div>
          </button>
        )}
        {onOpenAddresses && (
          <button
            type="button"
            onClick={onOpenAddresses}
            className="flex items-center justify-between gap-sm p-md bg-surface-container-lowest border border-surface-container-high rounded-xl hover:shadow-md transition-shadow active:scale-[0.99]"
            aria-label={isAr ? "العناوين" : "Addresses"}
          >
            <div className="flex items-center gap-sm">
              <span
                className="material-symbols-outlined text-[24px] text-primary no-mirror"
                aria-hidden="true"
              >
                home
              </span>
              <div className="text-start">
                <div className="font-serif text-label-sm text-on-surface">
                  {isAr ? "العناوين" : "Addresses"}
                </div>
                <div className="text-[10px] text-on-surface-variant">
                  {addressesFromContext.length} {isAr ? "عنوان" : "saved"}
                </div>
              </div>
            </div>
          </button>
        )}
        {onOpenPaymentMethods && (
          <button
            type="button"
            onClick={onOpenPaymentMethods}
            className="flex items-center justify-between gap-sm p-md bg-surface-container-lowest border border-surface-container-high rounded-xl hover:shadow-md transition-shadow active:scale-[0.99]"
            aria-label={isAr ? "طرق الدفع" : "Payment methods"}
          >
            <div className="flex items-center gap-sm">
              <span
                className="material-symbols-outlined text-[24px] text-primary no-mirror"
                aria-hidden="true"
              >
                credit_card
              </span>
              <div className="text-start">
                <div className="font-serif text-label-sm text-on-surface">
                  {isAr ? "طرق الدفع" : "Payment"}
                </div>
                <div className="text-[10px] text-on-surface-variant">
                  {paymentMethodsFromContext.length} {isAr ? "بطاقة" : "saved"}
                </div>
              </div>
            </div>
          </button>
        )}
      </div>

      {/* Tabs */}
      <nav
        aria-label={isAr ? "أقسام الخزانة" : "Vault destinations"}
        className="flex gap-xs overflow-x-auto no-scrollbar border-b border-surface-variant pb-1"
      >
        <button
          onClick={() => setActiveTab("listings")}
          aria-selected={activeTab === "listings"}
          role="tab"
          className={`pb-3 font-bold uppercase tracking-widest text-label-md whitespace-nowrap px-2 border-b-2 transition-all ${
            activeTab === "listings"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {isAr ? "خزانتي معروضاتي" : "My Closet"} ({userListings.length})
        </button>
        <button
          onClick={() => setActiveTab("likes")}
          aria-selected={activeTab === "likes"}
          role="tab"
          className={`pb-3 font-bold uppercase tracking-widest text-label-md whitespace-nowrap px-2 border-b-2 transition-all ${
            activeTab === "likes"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {isAr ? "المفضلات" : "My Loves"} ({likedItems.length})
        </button>
        <button
          onClick={() => setActiveTab("chats")}
          aria-selected={activeTab === "chats"}
          role="tab"
          className={`pb-3 font-bold uppercase tracking-widest text-label-md whitespace-nowrap px-2 border-b-2 transition-all ${
            activeTab === "chats"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {isAr ? "المحادثات" : "Chats / Offers"} ({chats.length})
        </button>
        <button
          type="button"
          onClick={onOpenPurchases}
          disabled={!onOpenPurchases}
          className="pb-3 px-2 font-bold uppercase tracking-widest text-label-md whitespace-nowrap border-b-2 border-transparent text-on-surface-variant hover:text-on-surface disabled:opacity-50"
        >
          {isAr ? "المشتريات" : "Purchases"} ({orders.length})
        </button>
        <button
          type="button"
          onClick={onOpenSales}
          disabled={!onOpenSales}
          className="pb-3 px-2 font-bold uppercase tracking-widest text-label-md whitespace-nowrap border-b-2 border-transparent text-on-surface-variant hover:text-on-surface disabled:opacity-50"
        >
          {isAr ? "المبيعات" : "Sales"}
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("rentals")}
          aria-selected={activeTab === "rentals"}
          role="tab"
          className={`pb-3 px-2 font-bold uppercase tracking-widest text-label-md whitespace-nowrap border-b-2 transition-all ${
            activeTab === "rentals"
              ? "border-primary text-primary"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {isAr ? "الإيجارات" : "Rentals"}
        </button>
      </nav>

      {/* Tab Content */}
      <main className="w-full mt-md" role="tabpanel">
        {/* Listings Tab */}
        {activeTab === "listings" &&
          (userListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-md text-center">
              <span
                className="material-symbols-outlined text-[48px] text-outline opacity-40"
                aria-hidden="true"
              >
                apparel
              </span>
              <p className="text-body-lg text-on-surface-variant font-sans">
                {isAr
                  ? "لم تقم بعرض أي منتجات للبيع بعد."
                  : "You haven't listed any items for sale yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-md">
              {userListings.map((item) => {
                const title = isAr ? item.titleAr : item.titleEn;
                return (
                  <ClickableCard
                    key={item.id}
                    onClick={() => onSelectProduct(item)}
                    ariaLabel={title}
                    className="bg-surface-container-lowest rounded-xl border border-surface-container-high overflow-hidden group cursor-pointer hover:shadow-md transition-all relative"
                  >
                    <div className="aspect-[4/5] bg-surface-container-low overflow-hidden">
                      <img
                        alt={title}
                        src={item.image}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                    <div className="p-md flex flex-col gap-1">
                      <h4 className="font-serif text-label-md text-on-surface line-clamp-1">
                        {title}
                      </h4>
                      <span className="font-bold text-primary text-label-sm">
                        AED {item.price}
                      </span>
                    </div>
                  </ClickableCard>
                );
              })}
            </div>
          ))}

        {/* Likes Tab (G-34: filter + share) */}
        {activeTab === "likes" && (
          <LikesTabContent
            likedItems={likedItems}
            isAr={isAr}
            onSelectProduct={onSelectProduct}
          />
        )}

        {/* Chats Tab */}
        {activeTab === "chats" &&
          (chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-md text-center">
              <span
                className="material-symbols-outlined text-[48px] text-outline opacity-40"
                aria-hidden="true"
              >
                chat
              </span>
              <p className="text-body-lg text-on-surface-variant font-sans">
                {isAr
                  ? "لا توجد رسائل نشطة حالياً."
                  : "No active messages yet."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-sm max-w-[600px] mx-auto font-sans">
              {chats.map((chat) => (
                <ClickableCard
                  key={chat.id}
                  onClick={() => onOpenChat(chat.id)}
                  ariaLabel={
                    isAr
                      ? `محادثة مع ${chat.sellerName}`
                      : `Chat with ${chat.sellerName}`
                  }
                  className="bg-surface-container-low border border-surface-container-high rounded-xl p-md flex items-center gap-md cursor-pointer hover:bg-surface-container-high transition-colors"
                >
                  <img
                    alt={chat.sellerName}
                    src={chat.sellerAvatar}
                    loading="lazy"
                    className="w-12 h-12 rounded-full object-cover border border-outline-variant flex-shrink-0"
                  />
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h4 className="text-label-md font-bold text-on-surface truncate">
                        {chat.sellerName}
                      </h4>
                      <span className="text-[11px] text-on-surface-variant flex-shrink-0">
                        {chat.lastMessageTime}
                      </span>
                    </div>
                    <p className="text-label-sm text-outline font-bold truncate">
                      {chat.productTitle}
                    </p>
                    <p className="text-body-md text-on-surface-variant truncate mt-0.5">
                      {chat.lastMessage}
                    </p>
                  </div>
                </ClickableCard>
              ))}
            </div>
          ))}

        {activeTab === "rentals" && (
          <div className="flex flex-col items-center justify-center py-16 gap-md text-center">
            <span
              className="material-symbols-outlined text-[48px] text-outline opacity-40"
              aria-hidden="true"
            >
              event_busy
            </span>
            <h2 className="font-serif text-headline-sm text-on-surface">
              {isAr ? "الإيجار غير متاح حالياً" : "Rentals are not available yet"}
            </h2>
            <p className="max-w-sm text-body-md text-on-surface-variant">
              {isAr
                ? "يمكنك البيع والشراء الآن. سنضيف مسار الإيجار بعد اكتمال سياسات الحماية والتأمين."
                : "You can buy and resell today. Rentals will open after protection and insurance policies are ready."}
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

/**
 * G-34 — Loves tab content: filter by category + share-as-collection.
 * Lives inline because the parent (UserProfileView) doesn't yet know
 * about i18n strings or share deep-link policy.
 */
const LikesTabContent: React.FC<{
  likedItems: Product[];
  isAr: boolean;
  onSelectProduct: (p: Product) => void;
}> = ({ likedItems, isAr, onSelectProduct }) => {
  const [filter, setFilter] = React.useState<string>("all");
  const [shareCopied, setShareCopied] = React.useState(false);

  const categories = React.useMemo(() => {
    const set = new Set<string>();
    for (const item of likedItems) set.add(item.category);
    return ["all", ...Array.from(set).sort()];
  }, [likedItems]);

  const filtered =
    filter === "all"
      ? likedItems
      : likedItems.filter((i) => i.category === filter);

  const handleShare = async () => {
    const link = `https://mooday.app/@fatima_dxb/loves?cats=${encodeURIComponent(filter)}`;
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(link);
      }
    } catch {
      // Phase 1: ignore — modal/toast fallback will arrive in M10.
    }
    setShareCopied(true);
    setTimeout(() => setShareCopied(false), 2000);
  };

  if (likedItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-md text-center">
        <span
          className="material-symbols-outlined text-[48px] text-outline opacity-40"
          aria-hidden="true"
        >
          favorite
        </span>
        <p className="text-body-lg text-on-surface-variant font-sans">
          {isAr
            ? "لم تقم بالإعجاب بأي منتجات بعد."
            : "You haven't liked any items yet."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-sm">
      {/* Filter strip + share button */}
      <div className="flex items-center justify-between gap-sm">
        <div
          role="tablist"
          aria-label={isAr ? "تصفية حسب الفئة" : "Filter by category"}
          className="flex gap-2 overflow-x-auto snap-x snap-mandatory no-scrollbar -mx-margin-mobile px-margin-mobile flex-grow min-w-0"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              role="tab"
              aria-selected={filter === cat}
              onClick={() => setFilter(cat)}
              className={`flex-shrink-0 snap-start px-3 py-1.5 rounded-full text-label-sm uppercase tracking-wider border ${
                filter === cat
                  ? "bg-primary text-on-primary border-primary font-bold"
                  : "bg-surface-container-lowest text-on-surface border-surface-container-high"
              }`}
            >
              {cat === "all" ? (isAr ? "الكل" : "All") : cat}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={handleShare}
          aria-label={isAr ? "مشاركة المجموعة" : "Share collection"}
          className="flex-shrink-0 px-3 py-1.5 rounded-full border border-primary text-primary text-label-sm font-bold uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-transform"
        >
          <span
            className="material-symbols-outlined text-[16px] no-mirror"
            aria-hidden="true"
          >
            {shareCopied ? "check" : "share"}
          </span>
          <span>
            {shareCopied
              ? isAr
                ? "تم النسخ"
                : "Copied"
              : isAr
                ? "مشاركة"
                : "Share"}
          </span>
        </button>
      </div>

      {/* Result count */}
      <p className="text-[10px] uppercase tracking-wider text-outline font-bold px-1">
        {filtered.length} {isAr ? "منتج" : "items"}{" "}
        {filter !== "all" ? `(${filter})` : ""}
      </p>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 gap-md text-center">
          <span
            className="material-symbols-outlined text-[48px] text-outline opacity-40"
            aria-hidden="true"
          >
            filter_alt_off
          </span>
          <p className="text-body-lg text-on-surface-variant font-sans">
            {isAr ? "لا توجد عناصر بهذه الفئة." : "No items in this category."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-md">
          {filtered.map((item) => {
            const title = isAr ? item.titleAr : item.titleEn;
            return (
              <ClickableCard
                key={item.id}
                onClick={() => onSelectProduct(item)}
                ariaLabel={title}
                className="bg-surface-container-lowest rounded-xl border border-surface-container-high overflow-hidden group cursor-pointer hover:shadow-md transition-all relative"
              >
                <div className="aspect-[4/5] bg-surface-container-low overflow-hidden">
                  <img
                    alt={title}
                    src={item.image}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-md flex flex-col gap-1">
                  <h4 className="font-serif text-label-md text-on-surface line-clamp-1">
                    {title}
                  </h4>
                  <span className="font-bold text-primary text-label-sm">
                    AED {item.price}
                  </span>
                </div>
              </ClickableCard>
            );
          })}
        </div>
      )}
    </div>
  );
};
