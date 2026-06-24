"use client";

import React, { useState } from "react";
import { useApp, Product } from "@/context/AppContext";

interface UserProfileViewProps {
  onSelectProduct: (product: Product) => void;
  onOpenChat: (threadId: string) => void;
}

export const UserProfileView: React.FC<UserProfileViewProps> = ({
  onSelectProduct,
  onOpenChat,
}) => {
  const { language, listings, likes, chats } = useApp();
  const isAr = language === "ar";
  
  const [activeTab, setActiveTab] = useState<"listings" | "likes" | "chats">("listings");

  // Mock current user profile
  const userProfile = {
    nameEn: "Fatima AlMansoori",
    nameAr: "فاطمة المنصوري",
    avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuBvXVMd9yf_cKLCM9iTBl0hkMxU8qwGlmR5zem59BMB4KmmPqnBFhlgGAdKm4hXbMRi5WoJABe4HbXGvd5qUOM6ZDdF_v3QXh_J7RBOYPZl9bLKp3s7gEOzyEsENfrnZzBStCslQ15yhaIRsRcqDRAkriyyBE2jAXKQX-5NSo1i0jTR9DtITlHUH9Ygpo__Ov153J2Qo5j1U9G-7y_7dmLZQHKqe7ikbz2dHf0i3lX-pmK23BFOKsRXCXiniZprDQ11X91fLpDsmUBq",
    handle: "@fatima_dxb",
    rating: 4.9,
    reviewsCount: 28,
    followers: 1420,
    following: 382,
    locationEn: "Dubai, UAE",
    locationAr: "دبي، الإمارات",
  };

  // User's custom created listings (for simplicity, we assume custom listings belong to this user)
  const userListings = listings.filter(item => item.id.startsWith("custom-"));
  const likedItems = listings.filter(item => likes.includes(item.id));

  return (
    <div className="w-full max-w-[1000px] mx-auto flex flex-col gap-lg pb-10">
      {/* Profile Card Header */}
      <section className="bg-surface-container-low border border-surface-container-high rounded-xl p-lg flex flex-col sm:flex-row items-center gap-lg shadow-sm relative">
        <img
          alt={isAr ? userProfile.nameAr : userProfile.nameEn}
          src={userProfile.avatar}
          className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-4 border-primary-fixed-dim"
        />

        <div className="flex-grow flex flex-col items-center sm:items-start text-center sm:text-left gap-xs">
          <h2 className="font-serif text-headline-sm sm:text-headline-md text-on-surface">
            {isAr ? userProfile.nameAr : userProfile.nameEn}
          </h2>
          <p className="text-label-md text-primary font-bold">{userProfile.handle}</p>
          <p className="text-label-sm text-on-surface-variant flex items-center gap-1 mt-1 justify-center sm:justify-start">
            <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
            {isAr ? userProfile.locationAr : userProfile.locationEn}
          </p>

          {/* Review stars */}
          <div className="flex items-center gap-1 mt-2 justify-center sm:justify-start">
            <div className="flex text-tertiary-container">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  star
                </span>
              ))}
            </div>
            <span className="text-label-sm text-on-surface font-bold ml-1">{userProfile.rating}</span>
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

      {/* Tabs */}
      <nav className="flex border-b border-surface-variant justify-around sm:justify-start sm:gap-lg">
        <button
          onClick={() => setActiveTab("listings")}
          className={`pb-3 font-bold uppercase tracking-widest text-label-md whitespace-nowrap px-2 border-b-2 transition-all ${
            activeTab === "listings" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {isAr ? "خزانتي معروضاتي" : "My Closet"} ({userListings.length})
        </button>
        <button
          onClick={() => setActiveTab("likes")}
          className={`pb-3 font-bold uppercase tracking-widest text-label-md whitespace-nowrap px-2 border-b-2 transition-all ${
            activeTab === "likes" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {isAr ? "المفضلات" : "My Loves"} ({likedItems.length})
        </button>
        <button
          onClick={() => setActiveTab("chats")}
          className={`pb-3 font-bold uppercase tracking-widest text-label-md whitespace-nowrap px-2 border-b-2 transition-all ${
            activeTab === "chats" ? "border-primary text-primary" : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          {isAr ? "المحادثات" : "Chats / Offers"} ({chats.length})
        </button>
      </nav>

      {/* Tab Content */}
      <main className="w-full mt-md">
        {/* Listings Tab */}
        {activeTab === "listings" && (
          userListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-md text-center">
              <span className="material-symbols-outlined text-[48px] text-outline opacity-40">
                apparel
              </span>
              <p className="text-body-lg text-on-surface-variant font-sans">
                {isAr ? "لم تقم بعرض أي منتجات للبيع بعد." : "You haven't listed any items for sale yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-md">
              {userListings.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectProduct(item)}
                  className="bg-surface-container-lowest rounded-xl border border-surface-container-high overflow-hidden group cursor-pointer hover:shadow-md transition-all relative"
                >
                  <div className="aspect-[4/5] bg-surface-container-low overflow-hidden">
                    <img
                      alt={isAr ? item.titleAr : item.titleEn}
                      src={item.image}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-md flex flex-col gap-1">
                    <h4 className="font-serif text-label-md text-on-surface line-clamp-1">
                      {isAr ? item.titleAr : item.titleEn}
                    </h4>
                    <span className="font-bold text-primary text-label-sm">
                      AED {item.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Likes Tab */}
        {activeTab === "likes" && (
          likedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-md text-center">
              <span className="material-symbols-outlined text-[48px] text-outline opacity-40">
                favorite
              </span>
              <p className="text-body-lg text-on-surface-variant font-sans">
                {isAr ? "لم تقم بالإعجاب بأي منتجات بعد." : "You haven't liked any items yet."}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-md">
              {likedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => onSelectProduct(item)}
                  className="bg-surface-container-lowest rounded-xl border border-surface-container-high overflow-hidden group cursor-pointer hover:shadow-md transition-all relative"
                >
                  <div className="aspect-[4/5] bg-surface-container-low overflow-hidden">
                    <img
                      alt={isAr ? item.titleAr : item.titleEn}
                      src={item.image}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-md flex flex-col gap-1">
                    <h4 className="font-serif text-label-md text-on-surface line-clamp-1">
                      {isAr ? item.titleAr : item.titleEn}
                    </h4>
                    <span className="font-bold text-primary text-label-sm">
                      AED {item.price}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* Chats Tab */}
        {activeTab === "chats" && (
          chats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-md text-center">
              <span className="material-symbols-outlined text-[48px] text-outline opacity-40">
                chat
              </span>
              <p className="text-body-lg text-on-surface-variant font-sans">
                {isAr ? "لا توجد رسائل نشطة حالياً." : "No active messages yet."}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-sm max-w-[600px] mx-auto font-sans">
              {chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => onOpenChat(chat.id)}
                  className="bg-surface-container-low border border-surface-container-high rounded-xl p-md flex items-center gap-md cursor-pointer hover:bg-surface-container-high transition-colors"
                >
                  <img
                    alt={chat.sellerName}
                    src={chat.sellerAvatar}
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
                </div>
              ))}
            </div>
          )
        )}
      </main>
    </div>
  );
};
