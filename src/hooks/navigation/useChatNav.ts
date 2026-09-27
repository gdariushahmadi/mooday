
import { getSellerProfile } from "@/data/seller-profile";
import { isOwnListing } from "@/lib/ownership";
import type React from "react";
import { useCallback } from "react";
import type { Product } from "@/context/AppContext";
import type { TabId, ViewState } from "@/types/navigation";
import type { OpenReportOpts, Awaitable } from "./types";


export function useChatNav(
  setCurrentView: React.Dispatch<React.SetStateAction<ViewState>>,
  setActiveTab: React.Dispatch<React.SetStateAction<TabId>>,
  setSelectedProduct: React.Dispatch<React.SetStateAction<Product | null>>,
  setActiveChatThreadId: React.Dispatch<React.SetStateAction<string | null>>,
  createChatThread: (product: Product) => Awaitable<string>,
  currentUserId: string | null | undefined,
  listings: Product[],
) {
  const startChat = useCallback(
    (product: Product) => {
      if (isOwnListing(product, currentUserId)) return;
      setSelectedProduct(null);
      const result = createChatThread(product);
      Promise.resolve(result)
        .then((threadId) => {
          setActiveChatThreadId(threadId);
        })
        .catch(() => {
        });
    },
    [createChatThread, currentUserId, setSelectedProduct, setActiveChatThreadId],
  );

  const startChatWithSeller = useCallback(
    (sellerId: string) => {
      if (sellerId === currentUserId) return;
      const seller = getSellerProfile(sellerId);
      const match =
        listings.find(
          (l) =>
            l.sellerId === sellerId ||
            (seller != null &&
              (l.sellerNameEn === seller.nameEn ||
                l.sellerNameAr === seller.nameAr)),
        ) ?? null;

      if (match) {
        if (isOwnListing(match, currentUserId)) return;
        Promise.resolve(createChatThread(match))
          .then((threadId) => {
            setSelectedProduct(null);
            setActiveChatThreadId(threadId);
          })
          .catch(() => {
          });
        return;
      }

      const synthetic: Product = {
        id: `seller-${sellerId}`,
        titleEn: seller?.nameEn ? `Chat with ${seller.nameEn}` : "Seller chat",
        titleAr: seller?.nameAr ? `محادثة مع ${seller.nameAr}` : "محادثة البائع",
        price: 0,
        originalPrice: 0,
        conditionEn: "Good",
        conditionAr: "جيد",
        sellerNameEn: seller?.nameEn ?? sellerId,
        sellerNameAr: seller?.nameAr ?? sellerId,
        sellerAvatar: seller?.avatar ?? "/sellers/sarah.jpg",
        sellerTypeEn: seller?.typeEn ?? "Seller",
        sellerTypeAr: seller?.typeAr ?? "بائع",
        saves: 0,
        image: seller?.avatar ?? "/sellers/sarah.jpg",
        images: [seller?.avatar ?? "/sellers/sarah.jpg"],
        descriptionEn: "",
        descriptionAr: "",
        category: "All",
        sellerId,
      };
      const threadId = createChatThread(synthetic);
      Promise.resolve(threadId)
        .then((id) => {
          setSelectedProduct(null);
          setActiveChatThreadId(id);
        })
        .catch(() => {
        });
    },
    [createChatThread, currentUserId, setSelectedProduct, setActiveChatThreadId, listings],
  );

  const closeChat = useCallback(() => {
    setActiveChatThreadId(null);
  }, [setActiveChatThreadId]);

  const openChat = useCallback(
    (threadId: string) => {
      setActiveChatThreadId(threadId);
    },
    [setActiveChatThreadId],
  );

  const openChats = useCallback(() => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setCurrentView("chats");
  }, [setSelectedProduct, setActiveChatThreadId, setCurrentView]);

  const closeChats = useCallback(() => {
    setCurrentView("profile");
    setActiveTab("profile");
  }, [setCurrentView, setActiveTab]);

  return {
    startChat,
    startChatWithSeller,
    closeChat,
    openChat,
    openChats,
    closeChats,
  };
}