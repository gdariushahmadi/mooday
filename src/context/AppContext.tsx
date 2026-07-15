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
import { type MyReview, DEFAULT_MY_REVIEWS } from "@/data/my-reviews";
import { type BlockedUser, DEFAULT_BLOCKED_USERS } from "@/data/blocked-users";
import { type ReportRecord, DEFAULT_REPORTS } from "@/data/reports";
import { type Dispute, DEFAULT_DISPUTES } from "@/data/disputes";
import {
  type User,
  type Session,
  type AuthErrorCode,
  DEFAULT_USERS,
  generateSessionToken,
  isValidEmail,
  MOCK_OTP_CODE,
} from "@/data/users";
import { useLocalStorageState } from "@/lib/hooks";
import {
  getPhase2Backend,
  type AuthenticatedUser,
  type OtpPurpose,
} from "@/services/backend";

type Awaitable<T> = T | Promise<T>;

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

export interface UserProfile {
  fullNameEn: string;
  fullNameAr: string;
  handle: string;
  avatar: string;
  bioEn: string;
  bioAr: string;
  locationEn: string;
  locationAr: string;
  styleTagsEn: string[];
  styleTagsAr: string[];
  rating: number;
  reviewsCount: number;
  followers: number;
  following: number;
}

const DEFAULT_USER_PROFILE: UserProfile = {
  fullNameEn: "Fatima AlMansoori",
  fullNameAr: "فاطمة المنصوري",
  handle: "@fatima_dxb",
  avatar: "/sellers/fatima-almansoori.jpg",
  bioEn:
    "Curating Gulf-inspired pre-loved fashion — kaftans, abayas, and elevated basics.",
  bioAr: "أختار أزياء منطقة الخليج المستعملة بحالة ممتازة — قفاطين وعبايات.",
  locationEn: "Dubai, UAE",
  locationAr: "دبي، الإمارات",
  styleTagsEn: ["Kaftan", "Abaya", "Vintage"],
  styleTagsAr: ["قفطان", "عباية", "كلاسيكي"],
  rating: 4.9,
  reviewsCount: 28,
  followers: 1420,
  following: 382,
};

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
  userProfile: UserProfile;
  updateUserProfile: (patch: Partial<UserProfile>) => Awaitable<void>;
  myReviews: MyReview[];
  addMyReview: (review: Omit<MyReview, "id">) => void;
  blockedUsers: BlockedUser[];
  blockUser: (user: Omit<BlockedUser, "id" | "date">) => void;
  unblockUser: (id: string) => void;
  reports: ReportRecord[];
  submitReport: (
    report: Omit<ReportRecord, "id" | "caseNumber" | "status" | "date">,
  ) => ReportRecord;
  disputes: Dispute[];
  openDispute: (
    dispute: Omit<Dispute, "id" | "status" | "date" | "timeline">,
  ) => Dispute;
  // Group A auth (Phase 1 mock — Phase 2 swaps for real backend)
  currentUser: { email: string; name: string } | null;
  /** Absent in legacy test fixtures; "supabase" means real Phase 2 auth. */
  authMode?: "mock" | "supabase";
  authReady?: boolean;
  pendingAuthEmail?: string;
  authError: AuthErrorCode | null;
  signUp: (input: {
    name: string;
    email: string;
    phone: string;
    password: string;
  }) => Awaitable<string | null>;
  signIn: (input: { email: string; password: string }) => Awaitable<boolean>;
  signOut: () => Awaitable<void>;
  verifyOtp: (
    email: string,
    code: string,
    purpose?: OtpPurpose,
  ) => Awaitable<boolean>;
  sendOtp: (email: string, purpose?: OtpPurpose) => Awaitable<string | null>;
  signInWithOAuth?: (provider: "google" | "apple") => Promise<boolean>;
  updateCurrentUserName: (name: string) => Awaitable<void>;
  resetPassword: (email: string, newPassword: string) => Awaitable<boolean>;
  addresses: Address[];
  addAddress: (address: Omit<Address, "id">) => Awaitable<void>;
  updateAddress: (
    id: string,
    patch: Partial<Omit<Address, "id">>,
  ) => Awaitable<void>;
  removeAddress: (id: string) => Awaitable<void>;
  setDefaultAddress: (id: string) => Awaitable<void>;
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
  myReviews: "mooday_my_reviews",
  blockedUsers: "mooday_blocked_users",
  reports: "mooday_reports",
  disputes: "mooday_disputes",
  users: "mooday_users",
  session: "mooday_session",
  pendingOtp: "mooday_pending_otp",
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
  const phase2Backend = useMemo(() => getPhase2Backend(), []);
  const authMode: "mock" | "supabase" = phase2Backend
    ? "supabase"
    : "mock";
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
  const [storedAddresses, setStoredAddresses] = useLocalStorageState<Address[]>(
    STORAGE_KEYS.addresses,
    DEFAULT_ADDRESSES,
  );
  const [remoteAddresses, setRemoteAddresses] = React.useState<Address[]>([]);
  const addresses = phase2Backend ? remoteAddresses : storedAddresses;
  const setAddresses = phase2Backend ? setRemoteAddresses : setStoredAddresses;
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
  const [storedUserProfile, setStoredUserProfile] = useLocalStorageState<UserProfile>(
    "mooday_user_profile",
    DEFAULT_USER_PROFILE,
  );
  const [remoteUserProfile, setRemoteUserProfile] =
    React.useState<UserProfile>(DEFAULT_USER_PROFILE);
  const userProfile = phase2Backend ? remoteUserProfile : storedUserProfile;
  const setUserProfile = phase2Backend
    ? setRemoteUserProfile
    : setStoredUserProfile;
  const [myReviews, setMyReviews] = useLocalStorageState<MyReview[]>(
    STORAGE_KEYS.myReviews,
    DEFAULT_MY_REVIEWS,
  );
  const [blockedUsers, setBlockedUsers] = useLocalStorageState<BlockedUser[]>(
    STORAGE_KEYS.blockedUsers,
    DEFAULT_BLOCKED_USERS,
  );
  const [reports, setReports] = useLocalStorageState<ReportRecord[]>(
    STORAGE_KEYS.reports,
    DEFAULT_REPORTS,
  );
  const [disputes, setDisputes] = useLocalStorageState<Dispute[]>(
    STORAGE_KEYS.disputes,
    DEFAULT_DISPUTES,
  );
  // Auth state (Phase 1 mock — Phase 2 swaps the storage layer for a real backend)
  const [users, setUsers] = useLocalStorageState<User[]>(
    STORAGE_KEYS.users,
    DEFAULT_USERS,
  );
  const [session, setSession] = useLocalStorageState<Session | null>(
    STORAGE_KEYS.session,
    null,
  );
  const [authError, setAuthError] = React.useState<AuthErrorCode | null>(null);
  const [remoteUser, setRemoteUser] =
    React.useState<AuthenticatedUser | null>(null);
  const [authReady, setAuthReady] = React.useState(!phase2Backend);
  const [pendingAuthEmail, setPendingAuthEmail] = React.useState("");

  useEffect(() => {
    if (!phase2Backend) return;

    // One-way security migration: never keep Phase 1 plaintext credentials or
    // cosmetic session tokens when the real backend is enabled.
    localStorage.removeItem(STORAGE_KEYS.users);
    localStorage.removeItem(STORAGE_KEYS.session);
    localStorage.removeItem(STORAGE_KEYS.pendingOtp);

    let active = true;
    void phase2Backend.auth.getCurrentUser().then((user) => {
      if (!active) return;
      setRemoteUser(user);
      setAuthReady(true);
    });
    const unsubscribe = phase2Backend.auth.subscribe((user) => {
      if (!active) return;
      setRemoteUser(user);
      setAuthReady(true);
    });
    return () => {
      active = false;
      unsubscribe();
    };
  }, [phase2Backend]);

  useEffect(() => {
    if (!phase2Backend || !remoteUser) return;
    let active = true;
    void Promise.all([
      phase2Backend.profiles.getMine(),
      phase2Backend.addresses.listMine(),
    ])
      .then(([profile, nextAddresses]) => {
        if (!active) return;
        if (profile) {
          setRemoteUserProfile((current) => ({ ...current, ...profile }));
        }
        setRemoteAddresses(nextAddresses);
      })
      .catch(() => {
        // The existing screens remain usable; mutation errors are surfaced by
        // their actions while this initial fetch can be retried on next auth event.
      });
    return () => {
      active = false;
    };
  }, [phase2Backend, remoteUser]);

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
      if (phase2Backend) {
        return phase2Backend.addresses.create(address).then((created) => {
          setAddresses((prev) => {
            const next = address.isDefault
              ? prev.map((item) => ({ ...item, isDefault: false }))
              : prev;
            return [...next, created];
          });
        });
      }
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
    [phase2Backend, setAddresses],
  );

  const updateAddress = useCallback(
    (id: string, patch: Partial<Omit<Address, "id">>) => {
      const commit = () => {
        setAddresses((prev) => {
          const next = prev.map((a) =>
            a.id === id ? { ...a, ...patch } : a,
          );
          if (patch.isDefault === true) {
            return next.map((a) => ({ ...a, isDefault: a.id === id }));
          }
          return next;
        });
      };
      if (phase2Backend) {
        return phase2Backend.addresses.update(id, patch).then(commit);
      }
      commit();
    },
    [phase2Backend, setAddresses],
  );

  const removeAddress = useCallback(
    (id: string) => {
      const commit = () => {
        setAddresses((prev) => {
          const filtered = prev.filter((a) => a.id !== id);
          if (filtered.length === 0) return filtered;
          const hasDefault = filtered.some((a) => a.isDefault);
          if (!hasDefault) filtered[0] = { ...filtered[0], isDefault: true };
          return filtered;
        });
      };
      if (phase2Backend) {
        return phase2Backend.addresses.remove(id).then(commit);
      }
      commit();
    },
    [phase2Backend, setAddresses],
  );

  const setDefaultAddress = useCallback(
    (id: string) => {
      const commit = () => {
        setAddresses((prev) =>
          prev.map((a) => ({ ...a, isDefault: a.id === id })),
        );
      };
      if (phase2Backend) {
        return phase2Backend.addresses.setDefault(id).then(commit);
      }
      commit();
    },
    [phase2Backend, setAddresses],
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

  const updateUserProfile = useCallback(
    (patch: Partial<UserProfile>) => {
      if (phase2Backend) {
        return phase2Backend.profiles.updateMine(patch).then(() => {
          setUserProfile((prev) => ({ ...prev, ...patch }));
        });
      }
      setUserProfile((prev) => ({ ...prev, ...patch }));
    },
    [phase2Backend, setUserProfile],
  );

  // ---------- Group A auth mutators (Phase 1 mock) ----------
  const signUp = useCallback(
    (input: {
      name: string;
      email: string;
      phone: string;
      password: string;
    }) => {
      setAuthError(null);
      if (phase2Backend) {
        setPendingAuthEmail(input.email.trim().toLowerCase());
        return phase2Backend.auth.signUp(input).then((result) => {
          if (!result.ok) {
            setAuthError(result.error);
            return null;
          }
          if (!result.needsVerification) setRemoteUser(result.value);
          return result.value.id;
        });
      }
      if (!isValidEmail(input.email)) {
        setAuthError("invalid_email");
        return null;
      }
      if (input.password.length < 8) {
        setAuthError("weak_password");
        return null;
      }
      if (
        users.some((u) => u.email.toLowerCase() === input.email.toLowerCase())
      ) {
        setAuthError("user_exists");
        return null;
      }
      const id = `user-${Date.now()}`;
      const user: User = {
        id,
        nameEn: input.name,
        nameAr: input.name,
        email: input.email.trim().toLowerCase(),
        phone: input.phone,
        password: input.password,
        createdAt: new Date().toISOString(),
      };
      setUsers((prev) => [...prev, user]);
      // Auto-sign-in on successful sign-up.
      const token = generateSessionToken(id);
      setSession({
        userId: id,
        email: user.email,
        token,
        createdAt: new Date().toISOString(),
      });
      return id;
    },
    [phase2Backend, setUsers, setSession, users],
  );

  const signIn = useCallback(
    (input: { email: string; password: string }) => {
      setAuthError(null);
      if (phase2Backend) {
        return phase2Backend.auth.signIn(input).then((result) => {
          if (!result.ok) {
            setAuthError(result.error);
            return false;
          }
          setRemoteUser(result.value);
          return true;
        });
      }
      const match = users.find(
        (u) => u.email.toLowerCase() === input.email.trim().toLowerCase(),
      );
      if (!match) {
        setAuthError("user_not_found");
        return false;
      }
      if (match.password !== input.password) {
        setAuthError("wrong_password");
        return false;
      }
      const token = generateSessionToken(match.id);
      setSession({
        userId: match.id,
        email: match.email,
        token,
        createdAt: new Date().toISOString(),
      });
      return true;
    },
    [phase2Backend, setSession, users],
  );

  const signOut = useCallback(() => {
    if (phase2Backend) {
      return phase2Backend.auth.signOut().then((result) => {
        if (!result.ok) {
          setAuthError(result.error);
          return;
        }
        setRemoteUser(null);
        setRemoteAddresses([]);
      });
    }
    setSession(null);
  }, [phase2Backend, setSession]);

  const verifyOtp = useCallback(
    (email: string, code: string, purpose: OtpPurpose = "signup") => {
      if (phase2Backend) {
        setAuthError(null);
        return phase2Backend.auth
          .verifyOtp(email, code, purpose)
          .then((result) => {
            if (!result.ok) {
              setAuthError(result.error);
              return false;
            }
            setRemoteUser(result.value);
            return true;
          });
      }
      // Demo mode: any email + the universal code "000000" succeeds.
      void email;
      return code === MOCK_OTP_CODE;
    },
    [phase2Backend],
  );

  const sendOtp = useCallback(
    (email: string, purpose: OtpPurpose = "signup") => {
      setPendingAuthEmail(email.trim().toLowerCase());
      if (phase2Backend) {
        setAuthError(null);
        return phase2Backend.auth.sendOtp(email, purpose).then((result) => {
          if (!result.ok) {
            setAuthError(result.error);
            return null;
          }
          return null;
        });
      }
      return MOCK_OTP_CODE;
    },
    [phase2Backend],
  );

  const signInWithOAuth = useCallback(
    async (provider: "google" | "apple") => {
      if (!phase2Backend) return false;
      setAuthError(null);
      const result = await phase2Backend.auth.signInWithOAuth(provider);
      if (!result.ok) {
        setAuthError(result.error);
        return false;
      }
      return true;
    },
    [phase2Backend],
  );

  const updateCurrentUserName = useCallback(
    (name: string) => {
      if (phase2Backend) {
        setRemoteUser((current) =>
          current ? { ...current, name } : current,
        );
        return phase2Backend.auth.updateName(name).then((result) => {
          if (!result.ok) setAuthError(result.error);
        });
      }
      setUsers((prev) =>
        prev.map((u) =>
          session?.userId === u.id ? { ...u, nameEn: name, nameAr: name } : u,
        ),
      );
    },
    [phase2Backend, setUsers, session],
  );

  const resetPassword = useCallback(
    (email: string, newPassword: string) => {
      if (phase2Backend) {
        void email;
        return phase2Backend.auth.resetPassword(newPassword).then((result) => {
          if (!result.ok) {
            setAuthError(result.error);
            return false;
          }
          return true;
        });
      }
      let success = false;
      setUsers((prev) =>
        prev.map((u) => {
          if (u.email.toLowerCase() === email.trim().toLowerCase()) {
            success = true;
            return { ...u, password: newPassword };
          }
          return u;
        }),
      );
      return success;
    },
    [phase2Backend, setUsers],
  );

  const addMyReview = useCallback(
    (review: Omit<MyReview, "id">) => {
      const id = `myrev-${Date.now()}`;
      setMyReviews((prev) => [{ id, ...review }, ...prev]);
    },
    [setMyReviews],
  );

  const blockUser = useCallback(
    (user: Omit<BlockedUser, "id" | "date">) => {
      const id = `blk-${Date.now()}`;
      setBlockedUsers((prev) => [
        ...prev,
        { ...user, id, date: new Date().toISOString() },
      ]);
    },
    [setBlockedUsers],
  );

  const unblockUser = useCallback(
    (id: string) => {
      setBlockedUsers((prev) => prev.filter((u) => u.id !== id));
    },
    [setBlockedUsers],
  );

  const submitReport = useCallback(
    (input: Omit<ReportRecord, "id" | "caseNumber" | "status" | "date">) => {
      const caseNumber = `MOODAY-${String(
        (reports.length + 1 + 10000).toString(),
      ).padStart(5, "0")}`;
      const record: ReportRecord = {
        ...input,
        id: `rep-${Date.now()}`,
        caseNumber,
        status: "open",
        date: new Date().toISOString(),
      };
      setReports((prev) => [record, ...prev]);
      return record;
    },
    [setReports, reports.length],
  );

  const openDispute = useCallback(
    (input: Omit<Dispute, "id" | "status" | "date" | "timeline">) => {
      const id = `disp-${Date.now()}`;
      const date = new Date().toISOString();
      const dispute: Dispute = {
        ...input,
        id,
        status: "open",
        date,
        timeline: [
          {
            status: "open",
            date,
            descriptionEn:
              "Dispute opened. Mooday support will reply within 24h.",
            descriptionAr: "تم فتح النزاع. سيرد الدعم خلال ٢٤ ساعة.",
          },
        ],
      };
      setDisputes((prev) => [dispute, ...prev]);
      return dispute;
    },
    [setDisputes],
  );

  // Resolve the active user record from the session + users list.
  const currentUser = useMemo(() => {
    if (phase2Backend) {
      return remoteUser
        ? { email: remoteUser.email, name: remoteUser.name }
        : null;
    }
    if (!session) return null;
    const match = users.find((u) => u.id === session.userId);
    if (!match) return null;
    return { email: match.email, name: match.nameEn };
  }, [phase2Backend, remoteUser, session, users]);

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
      userProfile,
      updateUserProfile,
      myReviews,
      addMyReview,
      blockedUsers,
      blockUser,
      unblockUser,
      reports,
      submitReport,
      disputes,
      openDispute,
      currentUser,
      authMode,
      authReady,
      pendingAuthEmail,
      authError,
      signUp,
      signIn,
      signOut,
      verifyOtp,
      sendOtp,
      signInWithOAuth,
      updateCurrentUserName,
      resetPassword,
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
      userProfile,
      updateUserProfile,
      myReviews,
      addMyReview,
      blockedUsers,
      blockUser,
      unblockUser,
      reports,
      submitReport,
      disputes,
      openDispute,
      currentUser,
      authMode,
      authReady,
      pendingAuthEmail,
      authError,
      signUp,
      signIn,
      signOut,
      verifyOtp,
      sendOtp,
      signInWithOAuth,
      updateCurrentUserName,
      resetPassword,
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
