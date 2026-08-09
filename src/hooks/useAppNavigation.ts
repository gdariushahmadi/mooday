"use client";

import { useCallback, useEffect, useState } from "react";
import { useApp, type Product } from "@/context/AppContext";
import {
  type TabId,
  type ViewState,
  VALID_VIEWS,
  readUrlParam,
  tabFromView,
  viewFromTab,
} from "@/types/navigation";
import { CATEGORIES } from "@/data/categories";
import { getSellerProfile } from "@/data/seller-profile";
import { isOwnListing } from "@/lib/ownership";

export type CategorySort = "newest" | "price-asc" | "price-desc" | "saves";

export const VALID_CATEGORY_SORTS: readonly CategorySort[] = [
  "newest",
  "price-asc",
  "price-desc",
  "saves",
] as const;

export type OpenReportOpts = {
  orderId?: string;
  targetId?: string;
};

export interface AppNavigation {
  /** Active bottom-nav tab (kept in sync with currentView for tab views). */
  activeTab: TabId;
  /** Currently rendered view. */
  currentView: ViewState;
  /** Product shown in the details overlay, or null. */
  selectedProduct: Product | null;
  /** Product for direct (Buy Now) checkout, or null (uses cart otherwise). */
  checkoutProduct: Product | null;
  /** Active chat thread id, or null. */
  activeChatThreadId: string | null;
  /** Active public seller profile id, or null. */
  activeSellerId: string | null;
  /** Active category landing category name, or null. */
  activeCategory: string | null;
  /** Sub-category filter on the category landing, or null (= "All"). */
  activeSubCategory: string | null;
  /** Sort order on the category landing. */
  activeCategorySort: CategorySort;
  /** Active single order id (for C-17 Order Tracking). */
  activeOrderId: string | null;
  /** Active listing being edited (D-21 Edit Listing). */
  activeListingId: string | null;
  /** Listing/seller id being reported (H-40), or null. */
  activeReportTargetId: string | null;
  /** All listings, exposed so deep components (e.g. PublicSellerProfile) can filter. */
  listings: Product[];

  // Mutators
  selectProduct: (product: Product) => void;
  closeProduct: () => void;
  navigateToCart: () => void;
  startChat: (product: Product) => void;
  startChatWithSeller: (sellerId: string) => void;
  closeChat: () => void;
  openChat: (threadId: string) => void;
  openSeller: (sellerId: string) => void;
  closeSeller: () => void;
  openCategory: (category: string) => void;
  closeCategory: () => void;
  setSubCategory: (sub: string | null) => void;
  setCategorySort: (sort: CategorySort) => void;
  openOrder: (orderId: string) => void;
  closeOrder: () => void;
  openSellPicker: () => void;
  closeSellPicker: () => void;
  openCloset: () => void;
  closeCloset: () => void;
  openEditListing: (productId: string) => void;
  closeEditListing: () => void;
  openSales: () => void;
  closeSales: () => void;
  openNotifications: () => void;
  closeNotifications: () => void;
  openChats: () => void;
  closeChats: () => void;
  openEditProfile: () => void;
  closeEditProfile: () => void;
  openAddresses: () => void;
  closeAddresses: () => void;
  openPaymentMethods: () => void;
  closePaymentMethods: () => void;
  openHelp: () => void;
  closeHelp: () => void;
  openLeaveReview: (orderId?: string) => void;
  closeLeaveReview: () => void;
  openMyReviews: () => void;
  closeMyReviews: () => void;
  openReport: (opts?: OpenReportOpts) => void;
  closeReport: () => void;
  openReturnRequest: (orderId?: string) => void;
  closeReturnRequest: () => void;
  openPayouts: () => void;
  closePayouts: () => void;
  openBlockedUsers: () => void;
  closeBlockedUsers: () => void;
  openSecuritySetup: () => void;
  closeSecuritySetup: () => void;
  openDispute: (orderId?: string) => void;
  closeDispute: () => void;
  openDisputesList: () => void;
  closeDisputesList: () => void;
  openSignUp: () => void;
  closeSignUp: () => void;
  openOtp: () => void;
  closeOtp: () => void;
  openSignIn: () => void;
  closeSignIn: () => void;
  openForgotPassword: () => void;
  closeForgotPassword: () => void;
  openSocialLogin: () => void;
  closeSocialLogin: () => void;
  checkoutProductDirect: (product: Product) => void;
  checkoutFromActiveChat: () => void;
  checkoutBack: () => void;
  checkoutSuccess: () => void;
  changeTab: (tab: TabId) => void;
  setView: (view: ViewState) => void;
  goHome: () => void;
}

function resolveInitialView(): ViewState {
  const checkoutId = readUrlParam("checkout");
  if (checkoutId) return "checkout";
  const v = readUrlParam("view") as ViewState | null;
  if (v && VALID_VIEWS.includes(v)) return v;
  // Deep-link params without ?view= — same pattern as seller.
  if (readUrlParam("seller")) return "seller";
  if (readUrlParam("category")) return "category";
  if (readUrlParam("product")) return "home";
  // Search intent via ?q= (or bare search query) without ?view=.
  if (readUrlParam("q")) return "search";
  return "home";
}

/**
 * Central navigation state for the app shell.
 *
 * Handles deep-link initialization from URL params (read once in lazy
 * useState initializers — no useEffect, no setState-in-effect lint error),
 * overlay state (product details, chat), and the mapping between the
 * bottom-nav tabs and the view state.
 */
export function useAppNavigation(): AppNavigation {
  const { createChatThread, listings, currentUserId } = useApp();

  const [activeTab, setActiveTab] = useState<TabId>(() =>
    tabFromView(readUrlParam("view") ?? resolveInitialView()),
  );
  const [currentView, setCurrentView] = useState<ViewState>(resolveInitialView);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    const productId = readUrlParam("product");
    if (!productId) return null;
    return listings.find((p) => p.id === productId) ?? null;
  });
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(() => {
    const checkoutId = readUrlParam("checkout");
    if (!checkoutId) return null;
    return listings.find((p) => p.id === checkoutId) ?? null;
  });
  const [activeChatThreadId, setActiveChatThreadId] = useState<string | null>(
    () => readUrlParam("chat"),
  );
  const [activeSellerId, setActiveSellerId] = useState<string | null>(() => {
    const id = readUrlParam("seller");
    return id ?? null;
  });
  const [activeCategory, setActiveCategory] = useState<string | null>(() => {
    const c = readUrlParam("category");
    if (c && (CATEGORIES as readonly string[]).includes(c)) return c;
    return null;
  });
  const [activeSubCategory, setActiveSubCategoryState] = useState<
    string | null
  >(() => {
    const sub = readUrlParam("sub");
    return sub ?? null;
  });
  const [activeCategorySort, setActiveCategorySortState] =
    useState<CategorySort>(() => {
      const s = readUrlParam("sort");
      if (s && (VALID_CATEGORY_SORTS as readonly string[]).includes(s)) {
        return s as CategorySort;
      }
      return "newest";
    });
  const [activeOrderId, setActiveOrderId] = useState<string | null>(() =>
    readUrlParam("order"),
  );
  const [activeListingId, setActiveListingId] = useState<string | null>(() =>
    readUrlParam("edit"),
  );
  const [activeReportTargetId, setActiveReportTargetId] = useState<
    string | null
  >(null);

  // Re-resolve deep-linked product/checkout once async/remote listings load.
  useEffect(() => {
    if (listings.length === 0) return;
    const productId = readUrlParam("product");
    if (productId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedProduct((prev) => {
        if (prev) return prev;
        return listings.find((p) => p.id === productId) ?? null;
      });
    }
    const checkoutId = readUrlParam("checkout");
    if (checkoutId) {
      setCheckoutProduct((prev) => {
        if (prev) return prev;
        return listings.find((p) => p.id === checkoutId) ?? null;
      });
    }
  }, [listings]);

  const selectProduct = useCallback((product: Product) => {
    setSelectedProduct(product);
  }, []);

  const closeProduct = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  const navigateToCart = useCallback(() => {
    setSelectedProduct(null);
    setCurrentView("bag");
  }, []);

  const startChat = useCallback(
    (product: Product) => {
      if (isOwnListing(product, currentUserId)) return;
      // Product details takes precedence over the chat overlay in AppContent,
      // so close it before waiting for a remote thread to be created.
      setSelectedProduct(null);
      const result = createChatThread(product);
      Promise.resolve(result)
        .then((threadId) => {
          setActiveChatThreadId(threadId);
        })
        .catch(() => {
          // Keep the product detail open if chat creation is rejected.
        });
    },
    [createChatThread, currentUserId],
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
            // Ignore rejected chat creation and keep the current view open.
          });
        return;
      }

      // No listing yet — open a synthetic thread keyed by seller id.
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
          // Ignore rejected chat creation and keep the current view open.
        });
    },
    [createChatThread, currentUserId, listings],
  );

  const closeChat = useCallback(() => {
    setActiveChatThreadId(null);
  }, []);

  const openChat = useCallback((threadId: string) => {
    setActiveChatThreadId(threadId);
  }, []);

  const openSeller = useCallback((sellerId: string) => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setActiveSellerId(sellerId);
    setCurrentView("seller");
  }, []);

  const closeSeller = useCallback(() => {
    setActiveSellerId(null);
    setCurrentView("home");
    setActiveTab("home");
  }, []);

  const openCategory = useCallback((category: string) => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setActiveSellerId(null);
    setActiveCategory(category);
    setActiveSubCategoryState(null);
    setActiveCategorySortState("newest");
    setCurrentView("category");
  }, []);

  const closeCategory = useCallback(() => {
    setActiveCategory(null);
    setActiveSubCategoryState(null);
    setCurrentView("home");
    setActiveTab("home");
  }, []);

  const setSubCategory = useCallback((sub: string | null) => {
    setActiveSubCategoryState(sub);
  }, []);

  const setCategorySort = useCallback((sort: CategorySort) => {
    setActiveCategorySortState(sort);
  }, []);

  const openOrder = useCallback((orderId: string) => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setActiveSellerId(null);
    setActiveCategory(null);
    setActiveOrderId(orderId);
    setCurrentView("order");
  }, []);

  const closeOrder = useCallback(() => {
    setActiveOrderId(null);
    setCurrentView("purchases");
    setActiveTab("profile");
  }, []);

  const openSellPicker = useCallback(() => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setActiveSellerId(null);
    setActiveCategory(null);
    setActiveOrderId(null);
    setActiveListingId(null);
    // Open the actual listing form (D-19). The mode picker (D-18) is
    // reached via the "sell" tab or via changeTab("sell").
    setCurrentView("sell");
  }, []);

  const closeSellPicker = useCallback(() => {
    setCurrentView("home");
    setActiveTab("home");
  }, []);

  const openCloset = useCallback(() => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setActiveSellerId(null);
    setActiveCategory(null);
    setActiveOrderId(null);
    setActiveListingId(null);
    setCurrentView("closet");
  }, []);

  const closeCloset = useCallback(() => {
    setCurrentView("home");
    setActiveTab("home");
  }, []);

  const openEditListing = useCallback((productId: string) => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setActiveSellerId(null);
    setActiveCategory(null);
    setActiveOrderId(null);
    setActiveListingId(productId);
    setCurrentView("edit-listing");
  }, []);

  const closeEditListing = useCallback(() => {
    setActiveListingId(null);
    setCurrentView("closet");
  }, []);

  const openSales = useCallback(() => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setActiveSellerId(null);
    setActiveCategory(null);
    setActiveOrderId(null);
    setActiveListingId(null);
    setCurrentView("sales");
  }, []);

  const closeSales = useCallback(() => {
    setCurrentView("home");
    setActiveTab("home");
  }, []);

  const openNotifications = useCallback(() => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setActiveOrderId(null);
    setCurrentView("notifications");
  }, []);

  const closeNotifications = useCallback(() => {
    setCurrentView("home");
    setActiveTab("home");
  }, []);

  const openChats = useCallback(() => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setCurrentView("chats");
  }, []);

  const closeChats = useCallback(() => {
    setCurrentView("profile");
    setActiveTab("profile");
  }, []);

  const openEditProfile = useCallback(() => {
    setCurrentView("edit-profile");
  }, []);

  const closeEditProfile = useCallback(() => {
    setCurrentView("profile");
    setActiveTab("profile");
  }, []);

  const openAddresses = useCallback(() => {
    setCurrentView("addresses");
  }, []);

  const closeAddresses = useCallback(() => {
    setCurrentView("profile");
    setActiveTab("profile");
  }, []);

  const openPaymentMethods = useCallback(() => {
    setCurrentView("payment-methods");
  }, []);

  const closePaymentMethods = useCallback(() => {
    setCurrentView("profile");
    setActiveTab("profile");
  }, []);

  const openHelp = useCallback(() => {
    setCurrentView("help");
  }, []);

  const closeHelp = useCallback(() => {
    setCurrentView("settings");
  }, []);

  const openLeaveReview = useCallback((orderId?: string) => {
    if (orderId) setActiveOrderId(orderId);
    setSelectedProduct(null);
    setCurrentView("leave-review");
  }, []);

  const closeLeaveReview = useCallback(() => {
    setCurrentView("order");
  }, []);

  const openMyReviews = useCallback(() => {
    setCurrentView("my-reviews");
  }, []);

  const closeMyReviews = useCallback(() => {
    setCurrentView("purchases");
  }, []);

  const openReport = useCallback((opts?: OpenReportOpts) => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    if (opts?.orderId) setActiveOrderId(opts.orderId);
    setActiveReportTargetId(opts?.targetId ?? null);
    setCurrentView("report");
  }, []);

  const closeReport = useCallback(() => {
    setActiveReportTargetId(null);
    setActiveOrderId((orderId) => {
      if (orderId) {
        setCurrentView("order");
      } else {
        setActiveSellerId((sellerId) => {
          setCurrentView(sellerId ? "seller" : "home");
          if (!sellerId) setActiveTab("home");
          return sellerId;
        });
      }
      return orderId;
    });
  }, []);

  const openReturnRequest = useCallback((orderId?: string) => {
    if (orderId) setActiveOrderId(orderId);
    setSelectedProduct(null);
    setCurrentView("return-request");
  }, []);

  const closeReturnRequest = useCallback(() => {
    setCurrentView("order");
  }, []);

  const openPayouts = useCallback(() => {
    setSelectedProduct(null);
    setActiveChatThreadId(null);
    setCurrentView("payouts");
  }, []);

  const closePayouts = useCallback(() => {
    setCurrentView("home");
    setActiveTab("profile");
  }, []);

  const openBlockedUsers = useCallback(() => {
    setCurrentView("blocked-users");
  }, []);

  const openSecuritySetup = useCallback(() => {
    setCurrentView("security-setup");
  }, []);

  const closeSecuritySetup = useCallback(() => {
    setCurrentView("settings");
  }, []);

  const closeBlockedUsers = useCallback(() => {
    setCurrentView("settings");
  }, []);

  const openDispute = useCallback((orderId?: string) => {
    if (orderId) setActiveOrderId(orderId);
    setSelectedProduct(null);
    setCurrentView("dispute");
  }, []);

  const closeDispute = useCallback(() => {
    setCurrentView("order");
  }, []);

  const openDisputesList = useCallback(() => {
    setCurrentView("disputes-list");
  }, []);

  const closeDisputesList = useCallback(() => {
    setCurrentView("profile");
    setActiveTab("profile");
  }, []);

  const openSignUp = useCallback(() => {
    setCurrentView("signup");
  }, []);

  const closeSignUp = useCallback(() => {
    setCurrentView("home");
  }, []);

  const openOtp = useCallback(() => {
    setCurrentView("otp");
  }, []);

  const closeOtp = useCallback(() => {
    setCurrentView("signin");
  }, []);

  const openSignIn = useCallback(() => {
    setCurrentView("signin");
  }, []);

  const closeSignIn = useCallback(() => {
    setCurrentView("home");
  }, []);

  const openForgotPassword = useCallback(() => {
    setCurrentView("forgot-password");
  }, []);

  const closeForgotPassword = useCallback(() => {
    setCurrentView("signin");
  }, []);

  const openSocialLogin = useCallback(() => {
    setCurrentView("social-login");
  }, []);

  const closeSocialLogin = useCallback(() => {
    setCurrentView("home");
  }, []);

  const checkoutProductDirect = useCallback((product: Product) => {
    setCheckoutProduct(product);
    setCurrentView("checkout");
  }, []);

  const checkoutFromActiveChat = useCallback(() => {
    setActiveChatThreadId((threadId) => {
      if (!threadId) return null;
      // Thread ids follow the format `chat-{productId}`.
      const productId = threadId.replace(/^chat-/, "");
      const product = listings.find((p) => p.id === productId);
      if (product) {
        setCheckoutProduct(product);
        setCurrentView("checkout");
      } else {
        setCurrentView("bag");
      }
      return null;
    });
  }, [listings]);

  const changeTab = useCallback((tab: TabId) => {
    setSelectedProduct(null);
    setActiveSellerId(null);
    setActiveTab(tab);
    setCurrentView(viewFromTab(tab));
  }, []);

  const setView = useCallback((view: ViewState) => {
    setCurrentView(view);
  }, []);

  const goHome = useCallback(() => {
    changeTab("home");
  }, [changeTab]);

  const checkoutBack = useCallback(() => {
    setCheckoutProduct((product) => {
      setCurrentView(product ? "home" : "bag");
      return null;
    });
  }, []);

  const checkoutSuccess = useCallback(() => {
    setCheckoutProduct(null);
    goHome();
  }, [goHome]);

  return {
    activeTab,
    currentView,
    selectedProduct,
    checkoutProduct,
    activeChatThreadId,
    activeSellerId,
    activeCategory,
    activeSubCategory,
    activeCategorySort,
    activeOrderId,
    activeListingId,
    activeReportTargetId,
    listings,
    selectProduct,
    closeProduct,
    navigateToCart,
    startChat,
    startChatWithSeller,
    closeChat,
    openChat,
    openSeller,
    closeSeller,
    openCategory,
    closeCategory,
    setSubCategory,
    setCategorySort,
    openOrder,
    closeOrder,
    openSellPicker,
    closeSellPicker,
    openCloset,
    closeCloset,
    openEditListing,
    closeEditListing,
    openSales,
    closeSales,
    openNotifications,
    closeNotifications,
    openChats,
    closeChats,
    openEditProfile,
    closeEditProfile,
    openAddresses,
    closeAddresses,
    openPaymentMethods,
    closePaymentMethods,
    openHelp,
    closeHelp,
    openLeaveReview,
    closeLeaveReview,
    openMyReviews,
    closeMyReviews,
    openReport,
    closeReport,
    openReturnRequest,
    closeReturnRequest,
    openPayouts,
    closePayouts,
    openBlockedUsers,
    closeBlockedUsers,
    openSecuritySetup,
    closeSecuritySetup,
    openDispute,
    closeDispute,
    openDisputesList,
    closeDisputesList,
    openSignUp,
    closeSignUp,
    openOtp,
    closeOtp,
    openSignIn,
    closeSignIn,
    openForgotPassword,
    closeForgotPassword,
    openSocialLogin,
    closeSocialLogin,
    checkoutProductDirect,
    checkoutFromActiveChat,
    checkoutBack,
    checkoutSuccess,
    changeTab,
    setView,
    goHome,
  };
}
