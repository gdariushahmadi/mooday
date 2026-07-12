"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { defaultProducts, SEED_VERSION } from "@/data/products";
import { type Address, DEFAULT_ADDRESSES } from "@/data/addresses";
import {
  type PaymentMethod,
  DEFAULT_PAYMENT_METHODS,
} from "@/data/paymentMethods";
import { type Order, DEFAULT_ORDERS } from "@/data/orders";
import {
  type AppNotification,
  DEFAULT_NOTIFICATIONS,
} from "@/data/notifications";
import { useLocalStorageState } from "@/lib/hooks";

export interface Product {
  id: string;
  titleEn: string;
  titleAr: string;
  price: number;
  originalPrice: number;
  conditionEn: string;
  conditionAr: string;
  sellerNameEn: string;
  sellerNameAr: string;
  sellerAvatar: string;
  sellerTypeEn: string;
  sellerTypeAr: string;
  saves: number;
  image: string;
  images: string[];
  descriptionEn: string;
  descriptionAr: string;
  category: string;
  isAuthentic?: boolean;
  /** Apparel/footwear size. Optional — accessories don't have one. */
  size?: string;
  /** Localised colour name (EN). */
  colorEn?: string;
  /** Localised colour name (AR). */
  colorAr?: string;
  /** Listing mode. Defaults to "resell". Rent is reserved for Phase 4. */
  mode?: "resell" | "rent";
}

export interface ChatMessage {
  id: string;
  sender: "user" | "seller";
  text: string;
  time: string;
}

export interface ChatThread {
  id: string;
  sellerName: string;
  sellerAvatar: string;
  productTitle: string;
  productImage: string;
  productPrice: number;
  lastMessage: string;
  lastMessageTime: string;
  messages: ChatMessage[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AppContextType {
  language: "en" | "ar";
  setLanguage: (lang: "en" | "ar") => void;
  listings: Product[];
  addListing: (product: Omit<Product, "id" | "saves">) => void;
  updateListing: (id: string, patch: Partial<Omit<Product, "id">>) => void;
  removeListing: (id: string) => void;
  likes: string[];
  toggleLike: (productId: string) => void;
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  chats: ChatThread[];
  sendChatMessage: (threadId: string, text: string) => void;
  createChatThread: (product: Product) => string;
  orders: Order[];
  recordOrder: (order: Order) => void;
  updateOrderStatus: (id: string, status: Order["status"]) => void;
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addresses: Address[];
  addAddress: (address: Omit<Address, "id">) => void;
  updateAddress: (id: string, patch: Partial<Omit<Address, "id">>) => void;
  removeAddress: (id: string) => void;
  setDefaultAddress: (id: string) => void;
  paymentMethods: PaymentMethod[];
  addPaymentMethod: (method: Omit<PaymentMethod, "id">) => void;
  removePaymentMethod: (id: string) => void;
  setDefaultPaymentMethod: (id: string) => void;
}

// Exported for tests and advanced consumers that need to pass a custom
// provider value (e.g. storybook, unit tests). Application code should
// use the `useApp` hook and the `AppProvider` component.
export const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  lang: "mooday_lang",
  likes: "mooday_likes",
  cart: "mooday_cart",
  chats: "mooday_chats",
  listings: "mooday_listings",
  seedVersion: "mooday_seed_version",
  addresses: "mooday_addresses",
  paymentMethods: "mooday_payment_methods",
  orders: "mooday_orders",
  notifications: "mooday_notifications",
} as const;

const DEFAULT_CHATS: ChatThread[] = [
  {
    id: "chat-handbag-tan",
    sellerName: "Sarah's Vintage",
    sellerAvatar: defaultProducts[0].sellerAvatar,
    productTitle: "Vintage Classic Handbag in Tan Leather",
    productImage: defaultProducts[0].image,
    productPrice: defaultProducts[0].price,
    lastMessage: "Let me know if you would like to make an offer!",
    lastMessageTime: "Yesterday",
    messages: [
      {
        id: "1",
        sender: "user",
        text: "Hi, is this handbag still available?",
        time: "Yesterday, 3:45 PM",
      },
      {
        id: "2",
        sender: "seller",
        text: "Hi there! Yes, it is still available. It's in excellent condition.",
        time: "Yesterday, 3:50 PM",
      },
      {
        id: "3",
        sender: "seller",
        text: "Let me know if you would like to make an offer!",
        time: "Yesterday, 3:51 PM",
      },
    ],
  },
];

// ---------- listings store (with seed migration) ----------

function subscribeStorage(callback: () => void): () => void {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

// Snapshot cache for listings — keyed by the raw localStorage string so
// `getListingsSnapshot` returns a stable reference until data changes.
let listingsCache: { raw: string | null; value: Product[] } | null = null;

function getListingsSnapshot(): Product[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.listings);
    const seedVersion = localStorage.getItem(STORAGE_KEYS.seedVersion);

    // Migration must run before caching so the cache reflects the
    // post-migration state. After migration, the raw string is updated
    // and the cache is invalidated below.
    if (seedVersion !== SEED_VERSION) {
      let customListings: Product[] = [];
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            customListings = parsed.filter(
              (p: Product) =>
                typeof p?.id === "string" && p.id.startsWith("custom-"),
            );
          }
        } catch {
          // Corrupted data — start fresh.
        }
      }
      const merged = [...customListings, ...defaultProducts];
      const serialized = JSON.stringify(merged);
      localStorage.setItem(STORAGE_KEYS.seedVersion, SEED_VERSION);
      localStorage.setItem(STORAGE_KEYS.listings, serialized);
      listingsCache = { raw: serialized, value: merged };
      return merged;
    }

    if (listingsCache && listingsCache.raw === raw) {
      return listingsCache.value;
    }

    let value: Product[];
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        value = Array.isArray(parsed) ? parsed : defaultProducts;
      } catch {
        value = defaultProducts;
      }
    } else {
      value = defaultProducts;
    }
    listingsCache = { raw, value };
    return value;
  } catch {
    return defaultProducts;
  }
}

function writeListings(next: Product[]) {
  localStorage.setItem(STORAGE_KEYS.listings, JSON.stringify(next));
  // Invalidate cache so the next getListingsSnapshot re-parses.
  listingsCache = null;
  window.dispatchEvent(
    new StorageEvent("storage", { key: STORAGE_KEYS.listings }),
  );
}

// ---------- provider ----------

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLang] = useLocalStorageState<"en" | "ar">(
    STORAGE_KEYS.lang,
    "en",
    {
      serialize: (v) => v,
      deserialize: (v) => (v === "ar" ? "ar" : "en"),
    },
  );

  const listings = useSyncExternalStore(
    subscribeStorage,
    getListingsSnapshot,
    () => defaultProducts,
  );

  const [likes, setLikes] = useLocalStorageState<string[]>(
    STORAGE_KEYS.likes,
    [],
  );
  const [cart, setCart] = useLocalStorageState<CartItem[]>(
    STORAGE_KEYS.cart,
    [],
  );
  const [chats, setChats] = useLocalStorageState<ChatThread[]>(
    STORAGE_KEYS.chats,
    DEFAULT_CHATS,
  );
  const [addresses, setAddresses] = useLocalStorageState<Address[]>(
    STORAGE_KEYS.addresses,
    DEFAULT_ADDRESSES,
  );
  const [paymentMethods, setPaymentMethods] = useLocalStorageState<
    PaymentMethod[]
  >(STORAGE_KEYS.paymentMethods, DEFAULT_PAYMENT_METHODS);
  const [orders, setOrders] = useLocalStorageState<Order[]>(
    STORAGE_KEYS.orders,
    DEFAULT_ORDERS,
  );
  const [notifications, setNotifications] = useLocalStorageState<
    AppNotification[]
  >(STORAGE_KEYS.notifications, DEFAULT_NOTIFICATIONS);

  // Sync document direction with language — side effect only, no setState.
  useEffect(() => {
    document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback(
    (lang: "en" | "ar") => {
      setLang(lang);
    },
    [setLang],
  );

  const addListing = useCallback((product: Omit<Product, "id" | "saves">) => {
    const newProduct: Product = {
      ...product,
      id: `custom-${Date.now()}`,
      saves: 0,
    };
    const current = getListingsSnapshot();
    writeListings([newProduct, ...current]);
  }, []);

  const updateListing = useCallback(
    (id: string, patch: Partial<Omit<Product, "id">>) => {
      const current = getListingsSnapshot();
      const next = current.map((p) => (p.id === id ? { ...p, ...patch } : p));
      writeListings(next);
    },
    [],
  );

  const removeListing = useCallback((id: string) => {
    const current = getListingsSnapshot();
    writeListings(current.filter((p) => p.id !== id));
  }, []);

  const toggleLike = useCallback(
    (productId: string) => {
      setLikes((prev) =>
        prev.includes(productId)
          ? prev.filter((id) => id !== productId)
          : [...prev, productId],
      );
    },
    [setLikes],
  );

  const addToCart = useCallback(
    (product: Product) => {
      setCart((prev) => {
        const idx = prev.findIndex((item) => item.product.id === product.id);
        if (idx > -1) {
          return prev.map((item, i) =>
            i === idx ? { ...item, quantity: item.quantity + 1 } : item,
          );
        }
        return [...prev, { product, quantity: 1 }];
      });
    },
    [setCart],
  );

  const removeFromCart = useCallback(
    (productId: string) => {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
    },
    [setCart],
  );

  const clearCart = useCallback(() => {
    setCart([]);
  }, [setCart]);

  const updateQuantity = useCallback(
    (productId: string, quantity: number) => {
      if (quantity <= 0) {
        removeFromCart(productId);
        return;
      }
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item,
        ),
      );
    },
    [setCart, removeFromCart],
  );

  const createChatThread = useCallback(
    (product: Product): string => {
      const threadId = `chat-${product.id}`;

      setChats((prev) => {
        if (prev.find((c) => c.id === threadId)) return prev;

        const newThread: ChatThread = {
          id: threadId,
          sellerName:
            language === "ar" ? product.sellerNameAr : product.sellerNameEn,
          sellerAvatar: product.sellerAvatar,
          productTitle: language === "ar" ? product.titleAr : product.titleEn,
          productImage: product.image,
          productPrice: product.price,
          lastMessage:
            language === "ar"
              ? "مرحباً! كيف يمكنني مساعدتك؟"
              : "Hi! How can I help you?",
          lastMessageTime: "Just now",
          messages: [
            {
              id: "1",
              sender: "seller",
              text:
                language === "ar"
                  ? `مرحباً! أنا سعيد باهتمامك بـ "${product.titleAr}". كيف يمكنني مساعدتك؟`
                  : `Hi there! Glad you're interested in my "${product.titleEn}". How can I help you today?`,
              time: "Just now",
            },
          ],
        };

        return [newThread, ...prev];
      });

      return threadId;
    },
    [setChats, language],
  );

  const sendChatMessage = useCallback(
    (threadId: string, text: string) => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

      // Add the user's message immediately.
      setChats((prev) => {
        const idx = prev.findIndex((c) => c.id === threadId);
        if (idx === -1) return prev;

        const userMsg: ChatMessage = {
          id: `msg-${Date.now()}`,
          sender: "user",
          text,
          time: timeStr,
        };

        const updatedThread: ChatThread = {
          ...prev[idx],
          messages: [...prev[idx].messages, userMsg],
          lastMessage: text,
          lastMessageTime: timeStr,
        };

        return prev.map((c, i) => (i === idx ? updatedThread : c));
      });

      // Simulate smart auto-reply from seller.
      setTimeout(() => {
        let replyText = "";
        const lowerText = text.toLowerCase();

        if (
          lowerText.includes("authentic") ||
          lowerText.includes("اصل") ||
          lowerText.includes("أصلي")
        ) {
          replyText =
            language === "ar"
              ? "نعم، هذا أصلي 100٪. لقد اشتريته من المتجر الرسمي ويمكنني تقديم الإيصال إذا لزم الأمر."
              : "Yes, it is 100% authentic! I purchased it from the official store and can share receipts if needed.";
        } else if (
          lowerText.includes("offer") ||
          lowerText.includes("price") ||
          lowerText.includes("discount") ||
          lowerText.includes("سعره") ||
          lowerText.includes("خصم") ||
          lowerText.includes("تخفيض")
        ) {
          replyText =
            language === "ar"
              ? "أنا منفتح على العروض المعقولة، لكن يرجى العلم أنه معروض بالفعل بسعر جيد جداً مقارنة بسعر التجزئة الأصلي!"
              : "I am open to reasonable offers, but please note it's already priced very low compared to its retail price!";
        } else if (
          lowerText.includes("condition") ||
          lowerText.includes("damage") ||
          lowerText.includes("نظيف") ||
          lowerText.includes("عيوب")
        ) {
          replyText =
            language === "ar"
              ? "الحالة ممتازة كما هو موضح بالصور. لا توجد خدوش أو تلف، واستخدمته بضع مرات فقط."
              : "The condition is excellent, just like in the photos. No scratches or damage, lightly used only a few times.";
        } else {
          replyText =
            language === "ar"
              ? "شكراً لك. سأتحقق من ذلك وأرد عليك بالتفاصيل قريباً!"
              : "Thanks! Let me check on that and get back to you with the details shortly.";
        }

        const sellerTime = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        setChats((prev) => {
          const idx = prev.findIndex((c) => c.id === threadId);
          if (idx === -1) return prev;

          const sellerMsg: ChatMessage = {
            id: `msg-${Date.now() + 1}`,
            sender: "seller",
            text: replyText,
            time: sellerTime,
          };

          const updatedThread: ChatThread = {
            ...prev[idx],
            messages: [...prev[idx].messages, sellerMsg],
            lastMessage: replyText,
            lastMessageTime: sellerTime,
          };

          return prev.map((c, i) => (i === idx ? updatedThread : c));
        });
      }, 1500);
    },
    [setChats, language],
  );

  const addAddress = useCallback(
    (address: Omit<Address, "id">) => {
      const id = `addr-${Date.now()}`;
      setAddresses((prev) => {
        const next: Address[] = [...prev, { ...address, id }];
        if (address.isDefault) {
          return next.map((a) => ({ ...a, isDefault: a.id === id }));
        }
        if (next.length === 1) {
          return next.map((a) => ({ ...a, isDefault: true }));
        }
        return next;
      });
    },
    [setAddresses],
  );

  const updateAddress = useCallback(
    (id: string, patch: Partial<Omit<Address, "id">>) => {
      setAddresses((prev) => {
        const next = prev.map((a) => (a.id === id ? { ...a, ...patch } : a));
        if (patch.isDefault === true) {
          return next.map((a) => ({ ...a, isDefault: a.id === id }));
        }
        return next;
      });
    },
    [setAddresses],
  );

  const removeAddress = useCallback(
    (id: string) => {
      setAddresses((prev) => {
        const filtered = prev.filter((a) => a.id !== id);
        if (filtered.length === 0) return filtered;
        const hasDefault = filtered.some((a) => a.isDefault);
        if (!hasDefault) filtered[0] = { ...filtered[0], isDefault: true };
        return filtered;
      });
    },
    [setAddresses],
  );

  const setDefaultAddress = useCallback(
    (id: string) => {
      setAddresses((prev) =>
        prev.map((a) => ({ ...a, isDefault: a.id === id })),
      );
    },
    [setAddresses],
  );

  const addPaymentMethod = useCallback(
    (method: Omit<PaymentMethod, "id">) => {
      const id = `pm-${Date.now()}`;
      setPaymentMethods((prev) => {
        const next: PaymentMethod[] = [...prev, { ...method, id }];
        if (method.isDefault) {
          return next.map((m) => ({ ...m, isDefault: m.id === id }));
        }
        if (next.length === 1) {
          return next.map((m) => ({ ...m, isDefault: true }));
        }
        return next;
      });
    },
    [setPaymentMethods],
  );

  const removePaymentMethod = useCallback(
    (id: string) => {
      setPaymentMethods((prev) => {
        const filtered = prev.filter((m) => m.id !== id);
        if (filtered.length === 0) return filtered;
        const hasDefault = filtered.some((m) => m.isDefault);
        if (!hasDefault) filtered[0] = { ...filtered[0], isDefault: true };
        return filtered;
      });
    },
    [setPaymentMethods],
  );

  const setDefaultPaymentMethod = useCallback(
    (id: string) => {
      setPaymentMethods((prev) =>
        prev.map((m) => ({ ...m, isDefault: m.id === id })),
      );
    },
    [setPaymentMethods],
  );

  const recordOrder = useCallback(
    (order: Order) => {
      setOrders((prev) => [order, ...prev]);
    },
    [setOrders],
  );

  const updateOrderStatus = useCallback(
    (id: string, status: Order["status"]) => {
      setOrders((prev) =>
        prev.map((o) => {
          if (o.id !== id) return o;
          // Append a timeline entry for the new status.
          const descriptionEn =
            status === "delivered"
              ? "Delivered — escrow released to seller."
              : status === "shipped"
                ? "Handed to courier, in transit."
                : status === "returned"
                  ? "Return received — refund processed."
                  : status === "cancelled"
                    ? "Order cancelled by buyer."
                    : "Payment secured.";
          const descriptionAr =
            status === "delivered"
              ? "تم التسليم — تحويل المبلغ للبائع."
              : status === "shipped"
                ? "تم تسليم الشحنة لشركة الشحن."
                : status === "returned"
                  ? "تم استلام المرتجع — تم الاسترداد."
                  : status === "cancelled"
                    ? "تم إلغاء الطلب."
                    : "تم تأمين المبلغ.";
          return {
            ...o,
            status,
            timeline: [
              ...o.timeline,
              {
                status,
                date: new Date().toISOString(),
                descriptionEn,
                descriptionAr,
              },
            ],
          };
        }),
      );
    },
    [setOrders],
  );

  const markNotificationRead = useCallback(
    (notifId: string) => {
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isUnread: false } : n)),
      );
    },
    [setNotifications],
  );

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  }, [setNotifications]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      listings,
      addListing,
      updateListing,
      removeListing,
      likes,
      toggleLike,
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      chats,
      sendChatMessage,
      createChatThread,
      addresses,
      addAddress,
      updateAddress,
      removeAddress,
      setDefaultAddress,
      paymentMethods,
      addPaymentMethod,
      removePaymentMethod,
      setDefaultPaymentMethod,
      orders,
      recordOrder,
      updateOrderStatus,
      notifications,
      markNotificationRead,
      markAllNotificationsRead,
    }),
    [
      language,
      setLanguage,
      listings,
      addListing,
      updateListing,
      removeListing,
      likes,
      toggleLike,
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      chats,
      sendChatMessage,
      createChatThread,
      addresses,
      addAddress,
      updateAddress,
      removeAddress,
      setDefaultAddress,
      paymentMethods,
      addPaymentMethod,
      removePaymentMethod,
      setDefaultPaymentMethod,
      orders,
      recordOrder,
      updateOrderStatus,
      notifications,
      markNotificationRead,
      markAllNotificationsRead,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
