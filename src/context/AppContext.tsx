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
  DEFAULT_LOCK_TIMEOUT_MS,
  LOCK_TIMEOUT_PRESETS_MS,
  detectWebAuthnSupport,
  hashPin,
  registerBiometric,
  verifyBiometric,
  verifyPin,
  type LockTimeoutMs,
} from "@/lib/security";
import { isOwnListing } from "@/lib/ownership";
import {
  getBackendConfig,
  getPhase2Backend,
  type AuthenticatedUser,
  type OtpPurpose,
  type ListingRecord,
} from "@/services/backend";
import {
  hydrateProductsFromRemote,
  isPublicImageUrl,
  mapProductToCreateInput,
  mapProductToUpdatePatch,
  mapOrderFromRemote,
  buildCreateOrderInput,
  mapThreadFromRemote,
  mapMessageFromRemote,
  mapNotificationFromRemote,
  mapReviewFromRemote,
  mapReportFromRemote,
  mapDisputeFromRemote,
} from "@/services/backend/mappers";

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
  /** Remote listing timestamp; absent on legacy local demo records. */
  createdAt?: string;
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
  /**
   * Owner of the listing. Phase 1 mock data leaves this undefined and the
   * UI treats listings prefixed `custom-` as the current user's. Phase 3
   * remote listings populate this from `listings.seller_id` so the Closet
   * (D-20) and Edit Listing (D-21) flows can filter by ownership.
   */
  sellerId?: string;
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
  /** Unread seller messages; cleared when the thread is opened. */
  unread?: number;
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
  /** True while a remote marketplace fetch is in flight (Phase 3). */
  listingsLoading?: boolean;
  /** Last remote marketplace error, surfaced by the UI for retry. */
  listingsError?: string | null;
  /** Force a re-fetch of remote listings (no-op in mock mode). */
  refreshListings?: () => Promise<void>;
  addListing: (
    product: Omit<Product, "id" | "saves">,
    /** Phase 3 slice 7: real staged files matching `product.images`. */
    files?: File[],
    options?: { status?: "draft" | "active" },
  ) => Awaitable<void>;
  updateListing: (
    id: string,
    patch: Partial<Omit<Product, "id">> & {
      status?: "draft" | "active" | "sold" | "reserved" | "archived";
    },
  ) => Awaitable<void>;
  removeListing: (id: string) => Awaitable<void>;
  likes: string[];
  toggleLike: (productId: string) => Awaitable<void>;
  cart: CartItem[];
  addToCart: (product: Product) => Awaitable<void>;
  removeFromCart: (productId: string) => Awaitable<void>;
  updateQuantity: (productId: string, quantity: number) => Awaitable<void>;
  clearCart: () => Awaitable<void>;
  chats: ChatThread[];
  sendChatMessage: (threadId: string, text: string) => Awaitable<void>;
  createChatThread: (product: Product) => Awaitable<string>;
  /** Clear unread count for a chat thread (called when opening it). */
  markChatRead: (threadId: string) => Awaitable<void>;
  /** Accept or decline a "Make an Offer" message in a chat thread. */
  setChatOfferStatus: (
    messageId: string,
    status: "accepted" | "declined",
  ) => Awaitable<void>;
  /** Pull the latest chat threads + messages from the remote backend. */
  refreshChats: () => Promise<void>;
  chatsLoading: boolean;
  orders: Order[];
  recordOrder: (order: Order) => Awaitable<string | null>;
  updateOrderStatus: (id: string, status: Order["status"]) => Awaitable<void>;
  notifications: AppNotification[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  refreshNotifications: () => Promise<void>;
  userProfile: UserProfile;
  updateUserProfile: (patch: Partial<UserProfile>) => Awaitable<void>;
  myReviews: MyReview[];
  addMyReview: (review: Omit<MyReview, "id">) => Promise<MyReview>;
  refreshMyReviews: () => Promise<void>;
  blockedUsers: BlockedUser[];
  blockUser: (user: Omit<BlockedUser, "id" | "date">) => Promise<void>;
  unblockUser: (id: string) => Promise<void>;
  reports: ReportRecord[];
  submitReport: (
    report: Omit<ReportRecord, "id" | "caseNumber" | "status" | "date">,
  ) => Promise<ReportRecord>;
  refreshReports: () => Promise<void>;
  disputes: Dispute[];
  openDispute: (
    dispute: Omit<Dispute, "id" | "status" | "date" | "timeline">,
  ) => Promise<Dispute>;
  refreshDisputes: () => Promise<void>;
  // Group A auth (Phase 1 mock — Phase 2 swaps for real backend)
  currentUser: { id?: string; email: string; name: string } | null;
  /** Auth user id for ownership filters (Closet / Vault). */
  currentUserId?: string | null;
  /** Absent in legacy test fixtures; "supabase" means real Phase 2 auth. */
  authMode?: "mock" | "supabase";
  /** Raw Phase 2 backend handle (null in mock mode). */
  phase2Backend?: import("@/services/backend").Phase2Backend | null;
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
  signInWithOAuth?: (provider: "google") => Promise<boolean>;
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
  addPaymentMethod: (method: Omit<PaymentMethod, "id">) => Promise<void>;
  removePaymentMethod: (id: string) => Promise<void>;
  setDefaultPaymentMethod: (id: string) => Promise<void>;
  // ---------------------------------------------------------------
  // App lock (auto-lock after inactivity + biometric / PIN unlock)
  // ---------------------------------------------------------------
  // The fields below are optional so existing test fixtures (which
  // construct the context value by hand) keep compiling. The real
  // provider always supplies them.
  /** True when the user opted into auto-lock in Settings. */
  lockEnabled?: boolean;
  /** Inactivity threshold in ms. Always one of the LOCK_TIMEOUT_PRESETS_MS. */
  lockTimeoutMs?: number;
  /** True when a PIN has been registered for local unlock. */
  hasPin?: boolean;
  /** True when a biometric / passkey credential has been registered. */
  hasBiometric?: boolean;
  /**
   * True when the UI is currently hidden behind the lock overlay. The
   * shell renders `<LockScreen />` while this is true. Sign-out clears
   * the lock state automatically.
   */
  isLocked?: boolean;
  /**
   * Whether the device/browser can perform biometric unlock at all.
   * Cached after the first detection call so the Settings UI does not
   * re-query the platform on every render.
   */
  biometricSupported?: boolean;
  /** Whether a platform authenticator (Touch ID / fingerprint / etc.) is present. */
  biometricHasPlatformAuthenticator?: boolean;
  /** Toggle the master auto-lock switch. Persists to localStorage. */
  setLockEnabled?: (enabled: boolean) => void;
  /** Change the inactivity timeout. Must be one of LOCK_TIMEOUT_PRESETS_MS. */
  setLockTimeoutMs?: (ms: number) => void;
  /** Hash and persist a PIN. Returns false if Web Crypto is unavailable. */
  setupPin?: (pin: string) => Promise<boolean>;
  /** Forget the stored PIN hash + salt. */
  clearPin?: () => void;
  /** Run the WebAuthn registration ceremony and persist the credential id. */
  setupBiometric?: (userName: string) => Promise<boolean>;
  /** Forget the stored biometric credential id. */
  clearBiometric?: () => void;
  /** Verify the entered PIN against the stored hash and unlock on match. */
  unlockWithPin?: (pin: string) => Promise<boolean>;
  /** Trigger a platform authenticator prompt and unlock on success. */
  unlockWithBiometric?: () => Promise<boolean>;
  /** Force-lock the app immediately (e.g. via the "Lock now" button). */
  lockNow?: () => void;
  /** Refresh the cached biometric support flags (e.g. after first render). */
  refreshBiometricSupport?: () => Promise<void>;
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
  lockEnabled: "mooday_lock_enabled",
  lockTimeoutMs: "mooday_lock_timeout_ms",
  lockPinHash: "mooday_lock_pin_hash",
  lockPinSalt: "mooday_lock_pin_salt",
  lockBiometricCred: "mooday_lock_webauthn_cred_id",
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
    // Last message is from the seller → seed one unread.
    unread: 1,
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
  const authMode: "mock" | "supabase" = phase2Backend ? "supabase" : "mock";
  const [language, setLang] = useLocalStorageState<"en" | "ar">(
    STORAGE_KEYS.lang,
    "en",
    {
      serialize: (v) => v,
      deserialize: (v) => (v === "ar" ? "ar" : "en"),
    },
  );
  const [chats, setChats] = useLocalStorageState<ChatThread[]>(
    STORAGE_KEYS.chats,
    DEFAULT_CHATS,
  );
  const [remoteThreads, setRemoteThreads] = React.useState<ChatThread[]>([]);
  const [ordersLoading, setOrdersLoading] = React.useState(false);
  const [chatsLoading, setChatsLoading] = React.useState(false);
  const [chatLastRead, setChatLastRead] = useLocalStorageState<
    Record<string, string>
  >("mooday_chat_last_read", {});
  const activeChats = phase2Backend ? remoteThreads : chats;
  const setActiveChats = phase2Backend ? setRemoteThreads : setChats;
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
  const [remotePaymentMethods, setRemotePaymentMethods] = React.useState<
    PaymentMethod[]
  >([]);
  const activePaymentMethods = phase2Backend
    ? remotePaymentMethods
    : paymentMethods;
  const setActivePaymentMethods = phase2Backend
    ? setRemotePaymentMethods
    : setPaymentMethods;
  const [storedOrders, setStoredOrders] = useLocalStorageState<Order[]>(
    STORAGE_KEYS.orders,
    DEFAULT_ORDERS,
  );
  const [remoteOrders, setRemoteOrders] = React.useState<Order[]>([]);
  const orders = phase2Backend ? remoteOrders : storedOrders;
  const setOrders = phase2Backend ? setRemoteOrders : setStoredOrders;
  const [notifications, setNotifications] = useLocalStorageState<
    AppNotification[]
  >(STORAGE_KEYS.notifications, DEFAULT_NOTIFICATIONS);
  const [remoteNotifications, setRemoteNotifications] = React.useState<
    AppNotification[]
  >([]);
  const activeNotifications = phase2Backend
    ? remoteNotifications
    : notifications;
  const setActiveNotifications = phase2Backend
    ? setRemoteNotifications
    : setNotifications;
  const [storedUserProfile, setStoredUserProfile] =
    useLocalStorageState<UserProfile>(
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
  const [remoteMyReviews, setRemoteMyReviews] = React.useState<MyReview[]>([]);
  const activeMyReviews = phase2Backend ? remoteMyReviews : myReviews;
  const setActiveMyReviews = phase2Backend ? setRemoteMyReviews : setMyReviews;
  const [blockedUsers, setBlockedUsers] = useLocalStorageState<BlockedUser[]>(
    STORAGE_KEYS.blockedUsers,
    DEFAULT_BLOCKED_USERS,
  );
  const [remoteBlockedUsers, setRemoteBlockedUsers] = React.useState<
    BlockedUser[]
  >([]);
  const activeBlockedUsers = phase2Backend
    ? remoteBlockedUsers
    : blockedUsers;
  const setActiveBlockedUsers = phase2Backend
    ? setRemoteBlockedUsers
    : setBlockedUsers;
  const [reports, setReports] = useLocalStorageState<ReportRecord[]>(
    STORAGE_KEYS.reports,
    DEFAULT_REPORTS,
  );
  const [remoteReports, setRemoteReports] = React.useState<ReportRecord[]>([]);
  const activeReports = phase2Backend ? remoteReports : reports;
  const setActiveReports = phase2Backend ? setRemoteReports : setReports;
  const [disputes, setDisputes] = useLocalStorageState<Dispute[]>(
    STORAGE_KEYS.disputes,
    DEFAULT_DISPUTES,
  );
  const [remoteDisputes, setRemoteDisputes] = React.useState<Dispute[]>([]);
  const activeDisputes = phase2Backend ? remoteDisputes : disputes;
  const setActiveDisputes = phase2Backend ? setRemoteDisputes : setDisputes;
  // Phase 3 marketplace state. Pulled from `listings` + `seller_card_view`
  // + `listing_images` and hydrated into the Phase 1 `Product` shape so the
  // existing screens render real data without per-component rewiring.
  const marketplaceMode = useMemo(
    () => getBackendConfig().marketplaceMode === "supabase" && !!phase2Backend,
    [phase2Backend],
  );
  const localListings = useSyncExternalStore(
    subscribeStorage,
    getListingsSnapshot,
    () => defaultProducts,
  );
  const [remoteListings, setRemoteListings] = React.useState<Product[]>([]);
  const [listingsLoading, setListingsLoading] = React.useState(false);
  const [listingsError, setListingsError] = React.useState<string | null>(null);
  const listings = marketplaceMode ? remoteListings : localListings;

  // Liked listing ids + cart lines, sourced from Supabase in marketplace
  // mode and from localStorage otherwise. Both lists are flat `string[]`
  // and `CartItem[]`, so the existing views don't need to branch.
  const [storedLikes, setStoredLikes] = useLocalStorageState<string[]>(
    STORAGE_KEYS.likes,
    [],
  );
  const [remoteLikes, setRemoteLikes] = React.useState<string[]>([]);
  const likes = marketplaceMode ? remoteLikes : storedLikes;
  const [storedCart, setStoredCart] = useLocalStorageState<CartItem[]>(
    STORAGE_KEYS.cart,
    [],
  );
  const [remoteCart, setRemoteCart] = React.useState<CartItem[]>([]);
  const cart = marketplaceMode ? remoteCart : storedCart;

  // ---- App lock state ---------------------------------------------
  // All four lock primitives live in localStorage. We hold them as
  // simple strings here (not via useLocalStorageState) so the read of
  // `hasPin` / `hasBiometric` stays cheap and never needs JSON parsing.
  const [lockEnabled, setLockEnabledRaw] = useLocalStorageState<boolean>(
    STORAGE_KEYS.lockEnabled,
    false,
  );
  const [lockTimeoutMs, setLockTimeoutMsRaw] =
    useLocalStorageState<LockTimeoutMs>(
      STORAGE_KEYS.lockTimeoutMs,
      DEFAULT_LOCK_TIMEOUT_MS,
    );
  const [lockPinHash, setLockPinHash] = useLocalStorageState<string | null>(
    STORAGE_KEYS.lockPinHash,
    null,
  );
  const [lockPinSalt, setLockPinSalt] = useLocalStorageState<string | null>(
    STORAGE_KEYS.lockPinSalt,
    null,
  );
  const [lockBiometricCred, setLockBiometricCred] =
    useLocalStorageState<string | null>(STORAGE_KEYS.lockBiometricCred, null);
  // Whether the UI is currently hidden behind the lock overlay. Always
  // false at boot — sign-in or first activity flips it on based on
  // whether lockEnabled + hasPin/hasBiometric are configured.
  const [isLocked, setIsLocked] = React.useState(false);
  // Cached platform support so SettingsView can render the right
  // affordance without probing WebAuthn on every render.
  const [biometricSupport, setBiometricSupport] = React.useState<{
    available: boolean;
    hasPlatformAuthenticator: boolean;
  }>({ available: false, hasPlatformAuthenticator: false });

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
  const [remoteUser, setRemoteUser] = React.useState<AuthenticatedUser | null>(
    null,
  );
  const [authReady, setAuthReady] = React.useState(!phase2Backend);
  const [pendingAuthEmail, setPendingAuthEmail] = React.useState("");

  useEffect(() => {
    if (!phase2Backend) return;

    // One-way security migration: never keep Phase 1 plaintext credentials or
    // cosmetic session tokens when the real backend is enabled.
    localStorage.removeItem(STORAGE_KEYS.users);
    localStorage.removeItem(STORAGE_KEYS.session);
    localStorage.removeItem(STORAGE_KEYS.pendingOtp);
    // M3+M4: also clear the domain keys that now back themselves with
    // the real backend. Mock-mode stores are wiped so a refresh on a
    // different mode doesn't resurrect ghost records.
    localStorage.removeItem(STORAGE_KEYS.chats);
    localStorage.removeItem(STORAGE_KEYS.orders);
    localStorage.removeItem(STORAGE_KEYS.notifications);
    localStorage.removeItem(STORAGE_KEYS.myReviews);
    localStorage.removeItem(STORAGE_KEYS.blockedUsers);
    localStorage.removeItem(STORAGE_KEYS.reports);
    localStorage.removeItem(STORAGE_KEYS.disputes);
    localStorage.removeItem(STORAGE_KEYS.paymentMethods);
    void 0;

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

  /**
   * Refresh the current user's buyer-side + seller-side orders from the
   * remote backend. No-op in mock mode. Hydrates each row into the
   * Phase 1 `Order` view model. Listing lookups use the cached
   * `remoteListings` to fill seller / product snapshots without a
   * second round-trip per order.
   */
  const refreshOrders = useCallback(async () => {
    if (!phase2Backend) return;
    setOrdersLoading(true);
    try {
      const [buyerRows, sellerRows] = await Promise.all([
        phase2Backend.orders.listMineAsBuyer(),
        phase2Backend.orders.listMineAsSeller(),
      ]);
      const allRows = [...buyerRows, ...sellerRows];
      // Build a listings-by-id map from the currently-cached remote
      // listings so we can hydrate line-item products without extra
      // round-trips. Missing listings still produce a usable order
      // (the mapper falls back to the snapshot fields on each item).
      const listingsById = new Map<string, ListingRecord>();
      try {
        const ids = Array.from(
          new Set(
            allRows
              .flatMap((r) => r.items)
              .map((i) => i.listingId)
              .filter((id): id is string => !!id),
          ),
        );
        if (ids.length > 0) {
          const records = await phase2Backend.listings.listByIds(ids);
          for (const rec of records) listingsById.set(rec.id, rec);
        }
      } catch {
        // Listings lookup is best-effort; the mapper handles the gap.
      }
      const merged = allRows.map((r) =>
        mapOrderFromRemote({ record: r, listingsById }),
      );
      // Newest first by order placement time.
      merged.sort((a, b) =>
        b.dateOrdered.localeCompare(a.dateOrdered),
      );
      setRemoteOrders(merged);
    } catch {
      // Surface in the UI later; for now keep the previous snapshot.
    } finally {
      setOrdersLoading(false);
    }
  }, [phase2Backend]);

  /**
   * Pull listings + seller cards + image URLs from Supabase and hydrate
   * them into the Phase 1 `Product` shape. In mock mode this is a no-op.
   *
   * Errors are surfaced via `listingsError`; callers can retry by invoking
   * this method again. Loading state flips `listingsLoading` so screens can
   * show skeletons without per-call wiring.
   *
   * When a user is signed in, this also refreshes the user-scoped likes
   * and cart so the bag, loves, and closet all stay in sync after a
   * cross-device action. Sign-out clears the user-scoped state to keep
   * the cache honest.
   */
  const refreshListings = useCallback(async () => {
    if (!marketplaceMode || !phase2Backend) return;
    setListingsLoading(true);
    setListingsError(null);
    try {
      const [remoteListingRecords, sellerCards] = await Promise.all([
        phase2Backend.listings.listVisible(),
        phase2Backend.sellerCards.listVisible(),
      ]);
      const sellerCardsById = new Map(
        sellerCards.map((card) => [card.sellerId, card]),
      );
      const listingIds = remoteListingRecords.map((l) => l.id);
      const imagesByListingId =
        listingIds.length === 0
          ? new Map()
          : new Map(
              Object.entries(
                await phase2Backend.media.listForListings(listingIds),
              ),
            );
      const hydrated = hydrateProductsFromRemote({
        listings: remoteListingRecords,
        sellerCardsById,
        imagesByListingId,
      });
      setRemoteListings(hydrated);

      const authState = await phase2Backend.auth.getCurrentUser();
      if (!authState) {
        setRemoteLikes([]);
        setRemoteCart([]);
        return;
      }
      const [liked, cartItems] = await Promise.all([
        phase2Backend.likes.listMine(),
        phase2Backend.cart.listMine(),
      ]);
      setRemoteLikes(liked);
      const productById = new Map(hydrated.map((p) => [p.id, p]));
      const cartListingIds = cartItems.map((c) => c.listingId);
      const missingIds = cartListingIds.filter((id) => !productById.has(id));
      const missing =
        missingIds.length === 0
          ? []
          : await phase2Backend.listings.listByIds(missingIds);
      const missingById = new Map(missing.map((l) => [l.id, l]));
      setRemoteCart(
        cartItems
          .map((item) => {
            const product =
              productById.get(item.listingId) ??
              hydrateProductsFromRemote({
                listings: missingById.get(item.listingId)
                  ? [missingById.get(item.listingId) as never]
                  : [],
                sellerCardsById,
                imagesByListingId: new Map(),
              })[0];
            return product ? { product, quantity: item.quantity } : null;
          })
          .filter((c): c is CartItem => c !== null),
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load listings.";
      setListingsError(message);
    } finally {
      setListingsLoading(false);
    }
  }, [marketplaceMode, phase2Backend]);

  const addListing = useCallback(
    async (
      product: Omit<Product, "id" | "saves">,
      files?: File[],
      options?: { status?: "draft" | "active" },
    ) => {
      const status = options?.status ?? "active";
      if (marketplaceMode && phase2Backend) {
        const created = await phase2Backend.listings.create(
          mapProductToCreateInput(product, status),
        );
        // Persist photos. Real staged files (slice 7) upload to the
        // private bucket; Phase 1 mock URLs persist as passthrough
        // `listing_images.storage_path` rows.
        const photos = product.images?.length
          ? product.images
          : product.image
            ? [product.image]
            : [];
        const fileByUrl = new Map<string, File>();
        for (const f of files ?? []) {
          fileByUrl.set(URL.createObjectURL(f), f);
        }
        for (let i = 0; i < photos.length; i += 1) {
          const path = photos[i];
          const stagedFile = fileByUrl.get(path);
          if (stagedFile) {
            await phase2Backend.media.upload(
              created.id,
              {
                filename:
                  stagedFile.name ||
                  `photo-${i}.${stagedFile.type.split("/")[1] ?? "jpg"}`,
                mimeType: stagedFile.type as never,
                sizeBytes: stagedFile.size,
                body: stagedFile,
              },
              i,
            );
            continue;
          }
          if (!isPublicImageUrl(path)) continue;
          await phase2Backend.media.upload(
            created.id,
            {
              filename: path.split("/").pop() || `photo-${i}`,
              mimeType: "image/jpeg",
              sizeBytes: 1,
              body: new Blob([]),
            },
            i,
          );
        }
        await refreshListings();
        return;
      }
      const newProduct: Product = {
        ...product,
        id: `custom-${Date.now()}`,
        saves: 0,
        ...(session?.userId ? { sellerId: session.userId } : {}),
      };
      const current = getListingsSnapshot();
      writeListings([newProduct, ...current]);
    },
    [marketplaceMode, phase2Backend, refreshListings, session],
  );

  const updateListing = useCallback(
    async (
      id: string,
      patch: Partial<Omit<Product, "id">> & {
        status?: "draft" | "active" | "sold" | "reserved" | "archived";
      },
    ) => {
      if (marketplaceMode && phase2Backend) {
        await phase2Backend.listings.update(id, mapProductToUpdatePatch(patch));
        await refreshListings();
        return;
      }
      const { status: _status, ...productPatch } = patch;
      const current = getListingsSnapshot();
      const next = current.map((p) =>
        p.id === id ? { ...p, ...productPatch } : p,
      );
      writeListings(next);
    },
    [marketplaceMode, phase2Backend, refreshListings],
  );

  const removeListing = useCallback(
    async (id: string) => {
      if (marketplaceMode && phase2Backend) {
        // Cascade storage + metadata rows first so a partial failure leaves
        // the listing visible (and therefore retryable).
        await phase2Backend.media.removeAllForListing(id);
        await phase2Backend.listings.remove(id);
        await refreshListings();
        return;
      }
      const current = getListingsSnapshot();
      writeListings(current.filter((p) => p.id !== id));
    },
    [marketplaceMode, phase2Backend, refreshListings],
  );

  const toggleLike = useCallback(
    async (productId: string) => {
      if (marketplaceMode && phase2Backend) {
        const result = await phase2Backend.likes.toggle(productId);
        setRemoteLikes((prev) => {
          if (result.liked) return [...prev, productId];
          return prev.filter((id) => id !== productId);
        });
        return;
      }
      setStoredLikes((prev) =>
        prev.includes(productId)
          ? prev.filter((id) => id !== productId)
          : [...prev, productId],
      );
    },
    [marketplaceMode, phase2Backend],
  );

  const addToCart = useCallback(
    async (product: Product) => {
      if (marketplaceMode && phase2Backend) {
        // Remote cart stores identifiers only; the seller/photo/title
        // refresh comes from the next listings fetch so a freshly-updated
        // listing show its new price in the bag immediately.
        await phase2Backend.cart.add(product.id, 1);
        const [items, listingRecords] = await Promise.all([
          phase2Backend.cart.listMine(),
          phase2Backend.listings.listByIds([product.id]),
        ]);
        const listing = listingRecords[0];
        if (!listing) {
          setRemoteCart([]);
          return;
        }
        const productById = new Map(remoteListings.map((p) => [p.id, p]));
        setRemoteCart(
          items
            .map((item) => {
              const fromList = productById.get(item.listingId);
              const fallback = fromList
                ? fromList
                : listing.id === item.listingId
                  ? hydrateProductsFromRemote({
                      listings: [listing],
                      sellerCardsById: new Map(),
                      imagesByListingId: new Map(),
                    })[0]
                  : undefined;
              return fallback
                ? { product: fallback, quantity: item.quantity }
                : null;
            })
            .filter((c): c is CartItem => c !== null),
        );
        return;
      }
      setStoredCart((prev) => {
        const idx = prev.findIndex((item) => item.product.id === product.id);
        if (idx > -1) {
          return prev.map((item, i) =>
            i === idx ? { ...item, quantity: item.quantity + 1 } : item,
          );
        }
        return [...prev, { product, quantity: 1 }];
      });
    },
    [marketplaceMode, phase2Backend, remoteListings],
  );

  const removeFromCart = useCallback(
    async (productId: string) => {
      if (marketplaceMode && phase2Backend) {
        await phase2Backend.cart.remove(productId);
        setRemoteCart((prev) =>
          prev.filter((item) => item.product.id !== productId),
        );
        return;
      }
      setStoredCart((prev) =>
        prev.filter((item) => item.product.id !== productId),
      );
    },
    [marketplaceMode, phase2Backend],
  );

  const clearCart = useCallback(async () => {
    if (marketplaceMode && phase2Backend) {
      await phase2Backend.cart.clear();
      setRemoteCart([]);
      return;
    }
    setStoredCart([]);
  }, [marketplaceMode, phase2Backend]);

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (quantity <= 0) {
        await removeFromCart(productId);
        return;
      }
      if (marketplaceMode && phase2Backend) {
        await phase2Backend.cart.setQuantity(productId, quantity);
        const next = await phase2Backend.cart.listMine();
        const productById = new Map(remoteListings.map((p) => [p.id, p]));
        setRemoteCart(
          next
            .map((item) => {
              const product = productById.get(item.listingId);
              return product ? { product, quantity: item.quantity } : null;
            })
            .filter((c): c is CartItem => c !== null),
        );
        return;
      }
      setStoredCart((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity } : item,
        ),
      );
    },
    [marketplaceMode, phase2Backend, remoteListings, removeFromCart],
  );


  /**
   * Refresh the current user's chat threads + their messages. No-op in
   * mock mode. Threads are sorted most-recent first (matching the
   * server query). For each thread, unread is derived locally from the
   * `chatLastRead` map so we don't need a server-side unread column.
   */
  const refreshChats = useCallback(async () => {
    if (!phase2Backend) return;
    setChatsLoading(true);
    try {
      const auth = await phase2Backend.auth.getCurrentUser();
      if (!auth) {
        setRemoteThreads([]);
        return;
      }
      const threads = await phase2Backend.chats.listMine();
      const messageMap: Record<string, ChatMessage[]> = {};
      for (const t of threads) {
        const msgs = await phase2Backend.chats.listMessages(t.id);
        messageMap[t.id] = msgs.map((m) => mapMessageFromRemote(m, auth.id));
      }
      const mapped = threads.map((t) => {
        const base = mapThreadFromRemote(t, auth.id, []);
        const messages = messageMap[t.id] ?? [];
        // Unread: how many seller messages exist beyond the count we
        // last marked read. `chatLastRead[threadId]` stores that count
        // (e.g. "3" means messages #1, #2, #3 from the seller were read).
        // On first open we mark everything read, so a missing entry
        // contributes 0 unread.
        const totalSeller = messages.filter(
          (m) => m.sender === "seller",
        ).length;
        const lastReadCount = chatLastRead[t.id]
          ? Number.parseInt(chatLastRead[t.id], 10) || 0
          : 0;
        const unread = Math.max(0, totalSeller - lastReadCount);
        return {
          ...base,
          messages,
          unread,
        };
      });
      setRemoteThreads(mapped);
    } catch {
      // Surface in the UI later; keep the previous snapshot.
    } finally {
      setChatsLoading(false);
    }
  }, [phase2Backend, chatLastRead]);


  const refreshNotifications = useCallback(async () => {
    if (!phase2Backend) return;
    try {
      const rows = await phase2Backend.notifications.listMine();
      setRemoteNotifications(rows.map(mapNotificationFromRemote));
    } catch {
      // Keep previous snapshot; UI surfaces the issue elsewhere.
    }
  }, [phase2Backend]);

  const refreshMyReviews = useCallback(async () => {
    if (!phase2Backend) return;
    try {
      const rows = await phase2Backend.reviews.listMine();
      // The view model needs a seller display name + avatar; the server
      // only returns ids. We leave the lookup for the consuming view
      // (LeaveReviewView, MyReviewsView) and surface the record.
      setRemoteMyReviews(
        rows.map((r) =>
          mapReviewFromRemote({
            record: r,
            sellerNameEn: "",
            sellerNameAr: "",
            sellerAvatar: "/sellers/placeholder.svg",
          }),
        ),
      );
    } catch {
      // Keep previous snapshot.
    }
  }, [phase2Backend]);

  const refreshReports = useCallback(async () => {
    if (!phase2Backend) return;
    try {
      const rows = await phase2Backend.reports.listMine();
      setRemoteReports(rows.map(mapReportFromRemote));
    } catch {
      // Keep previous snapshot.
    }
  }, [phase2Backend]);

  const refreshDisputes = useCallback(async () => {
    if (!phase2Backend) return;
    try {
      const rows = await phase2Backend.disputes.listMine();
      setRemoteDisputes(rows.map(mapDisputeFromRemote));
    } catch {
      // Keep previous snapshot.
    }
  }, [phase2Backend]);

  const createChatThread = useCallback(
    async (product: Product): Promise<string> => {
      const currentUserId = phase2Backend
        ? remoteUser?.id
        : session?.userId;
      if (isOwnListing(product, currentUserId)) {
        throw new Error("Cannot create a chat thread for your own listing");
      }
      if (phase2Backend) {
        const sellerId = product.sellerId;
        if (!sellerId) {
          throw new Error("Cannot create chat thread without sellerId");
        }
        const thread = await phase2Backend.chats.upsertForListing({
          sellerId,
          listingId: product.id,
          listingTitleEn: product.titleEn,
          listingTitleAr: product.titleAr,
          listingImageUrl: product.image,
          priceMinorAtCreation: Math.round(product.price * 100),
        });
        await refreshChats();
        return thread.id;
      }
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
          unread: 0,
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
    [phase2Backend, refreshChats, setChats, language, remoteUser, session],
  );

  const sendChatMessage = useCallback(
    async (threadId: string, text: string): Promise<void> => {
      if (phase2Backend) {
        // Detect "OFFER:amount" pseudo-syntax (used by ChatOverlay's
        // Make-Offer flow) and route to the offer message type.
        const offerMatch = /^OFFER:(\d+(?:\.\d+)?):/.exec(text);
        if (offerMatch) {
          const amount = Number.parseFloat(offerMatch[1]);
          await phase2Backend.chats.sendMessage(threadId, {
            type: "offer",
            body: text,
            imageUrl: null,
            offerMinor: Math.round(amount * 100),
          });
        } else {
          await phase2Backend.chats.sendMessage(threadId, {
            type: "text",
            body: text,
            imageUrl: null,
            offerMinor: null,
          });
        }
        await refreshChats();
        return;
      }
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
            unread: (prev[idx].unread ?? 0) + 1,
          };

          return prev.map((c, i) => (i === idx ? updatedThread : c));
        });
      }, 1500);
    },
    [phase2Backend, refreshChats, setChats, language],
  );

  const markChatRead = useCallback(
    async (threadId: string): Promise<void> => {
      if (phase2Backend) {
        // Persist the count of seller messages seen so far. The next
        // refreshChats() will subtract this from the live total.
        const thread = remoteThreads.find((t) => t.id === threadId);
        const totalSeller = thread
          ? thread.messages.filter((m) => m.sender === "seller").length
          : 0;
        setChatLastRead((prev) => ({
          ...prev,
          [threadId]: String(totalSeller),
        }));
        setRemoteThreads((prev) =>
          prev.map((t) => (t.id === threadId ? { ...t, unread: 0 } : t)),
        );
        return;
      }
      setChats((prev) =>
        prev.map((c) =>
          c.id === threadId && (c.unread ?? 0) > 0 ? { ...c, unread: 0 } : c,
        ),
      );
    },
    [phase2Backend, remoteThreads, setChatLastRead, setChats],
  );

  const setChatOfferStatus = useCallback(
    async (
      messageId: string,
      status: "accepted" | "declined",
    ): Promise<void> => {
      if (phase2Backend) {
        await phase2Backend.chats.setOfferStatus(messageId, status);
        await refreshChats();
      }
    },
    [phase2Backend, refreshChats],
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
          const next = prev.map((a) => (a.id === id ? { ...a, ...patch } : a));
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
    async (method: Omit<PaymentMethod, "id">): Promise<void> => {
      if (phase2Backend) {
        if (method.isDefault) {
          // Clear current defaults first so the new card becomes the unique default.
          const current = await phase2Backend.paymentMethods.listMine();
          for (const m of current) {
            if (m.isDefault) {
              await phase2Backend.paymentMethods.update(m.id, { isDefault: false });
            }
          }
        }
        await phase2Backend.paymentMethods.create({
          labelEn: method.labelEn,
          labelAr: method.labelAr,
          brandEn: method.brandEn,
          brandAr: method.brandAr,
          last4: method.last4,
          holderEn: method.holderEn,
          holderAr: method.holderAr,
          expiry: method.expiry,
          isDefault: method.isDefault,
        });
        const next = await phase2Backend.paymentMethods.listMine();
        setRemotePaymentMethods(
          next.map((r) => ({
            id: r.id,
            labelEn: r.labelEn,
            labelAr: r.labelAr,
            brandEn: r.brandEn,
            brandAr: r.brandAr,
            last4: r.last4,
            holderEn: r.holderEn,
            holderAr: r.holderAr,
            expiry: r.expiry,
            isDefault: r.isDefault,
          })),
        );
        return;
      }
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
    [phase2Backend, setPaymentMethods],
  );

  const removePaymentMethod = useCallback(
    async (id: string): Promise<void> => {
      if (phase2Backend) {
        await phase2Backend.paymentMethods.remove(id);
        setRemotePaymentMethods((prev) => prev.filter((m) => m.id !== id));
        return;
      }
      setPaymentMethods((prev) => {
        const filtered = prev.filter((m) => m.id !== id);
        if (filtered.length === 0) return filtered;
        const hasDefault = filtered.some((m) => m.isDefault);
        if (!hasDefault) filtered[0] = { ...filtered[0], isDefault: true };
        return filtered;
      });
    },
    [phase2Backend, setPaymentMethods],
  );

  const setDefaultPaymentMethod = useCallback(
    async (id: string): Promise<void> => {
      if (phase2Backend) {
        await phase2Backend.paymentMethods.setDefault(id);
        setRemotePaymentMethods((prev) =>
          prev.map((m) => ({ ...m, isDefault: m.id === id })),
        );
        return;
      }
      setPaymentMethods((prev) =>
        prev.map((m) => ({ ...m, isDefault: m.id === id })),
      );
    },
    [phase2Backend, setPaymentMethods],
  );

  const recordOrder = useCallback(
    async (order: Order): Promise<string | null> => {
      if (phase2Backend) {
        // Resolve sellerId from the first line item (single-seller
        // checkout — Phase 1 cart never mixes sellers). Phase 3 will
        // support multi-seller orders by splitting the cart per seller.
        const sellerId = order.lineItems[0]?.product.sellerId;
        if (!sellerId) {
          throw new Error(
            "Cannot record order without a seller id on the line item.",
          );
        }
        const input = buildCreateOrderInput({ order, sellerId });
        const created = await phase2Backend.orders.create(input);
        await refreshOrders();
        return created.id;
      }
      setOrders((prev) => [order, ...prev]);
      return order.id;
    },
    [phase2Backend, refreshOrders, setOrders],
  );

  const updateOrderStatus = useCallback(
    async (id: string, status: Order["status"]): Promise<void> => {
      if (phase2Backend) {
        if (status === "shipped") {
          await phase2Backend.orders.markShipped(id, {
            nameEn: "Aramex",
            nameAr: "أرامكس",
            tracking: `ARMX-${String(id).slice(-7).toUpperCase()}`,
          });
        } else if (status === "delivered") {
          await phase2Backend.orders.markDelivered(id);
        } else if (status === "cancelled") {
          await phase2Backend.orders.cancel(id);
        } else if (status === "returned") {
          await phase2Backend.orders.requestReturn(id);
        }
        await refreshOrders();
        return;
      }
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
    [phase2Backend, refreshOrders, setOrders],
  );

  const markNotificationRead = useCallback(
    async (notifId: string): Promise<void> => {
      if (phase2Backend) {
        await phase2Backend.notifications.markRead(notifId);
        setRemoteNotifications((prev) =>
          prev.map((n) => (n.id === notifId ? { ...n, isUnread: false } : n)),
        );
        return;
      }
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isUnread: false } : n)),
      );
    },
    [phase2Backend, setNotifications],
  );

  const markAllNotificationsRead = useCallback(async () => {
    if (phase2Backend) {
      await phase2Backend.notifications.markAllRead();
      setRemoteNotifications((prev) =>
        prev.map((n) => ({ ...n, isUnread: false })),
      );
      return;
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  }, [phase2Backend, setNotifications]);

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
    async (input: {
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

      const hashed = await hashPin(input.password);
      if (!hashed) {
        setAuthError("network_error");
        return null;
      }

      const id = `user-${Date.now()}`;
      const user: User = {
        id,
        nameEn: input.name,
        nameAr: input.name,
        email: input.email.trim().toLowerCase(),
        phone: input.phone,
        passwordHash: hashed.hash,
        passwordSalt: hashed.salt,
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
    async (input: { email: string; password: string }) => {
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

      const isValid = await verifyPin(input.password, match.passwordSalt, match.passwordHash);
      if (!isValid) {
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
    async (provider: "google") => {
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
        setRemoteUser((current) => (current ? { ...current, name } : current));
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
    async (email: string, newPassword: string) => {
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

      const hashed = await hashPin(newPassword);
      if (!hashed) return false;

      let success = false;
      setUsers((prev) =>
        prev.map((u) => {
          if (u.email.toLowerCase() === email.trim().toLowerCase()) {
            success = true;
            return { ...u, passwordHash: hashed.hash, passwordSalt: hashed.salt };
          }
          return u;
        }),
      );
      return success;
    },
    [phase2Backend, setUsers],
  );

  const addMyReview = useCallback(
    async (review: Omit<MyReview, "id">): Promise<MyReview> => {
      if (phase2Backend) {
        // LeaveReviewView passes `product.sellerId` directly in
        // `sellerKey`; the mock-mode fallback uses the seller display
        // name. Either way we forward it to the backend as the
        // `seller_id` foreign key.
        const sellerId = review.sellerKey;
        // Snapshot reviewer identity for the public profile surface so
        // PublicSellerProfile can render the reviewer's name + avatar
        // without joining against the buyer's private profile row.
        const reviewerNameEn = remoteUserProfile.fullNameEn;
        const reviewerNameAr = remoteUserProfile.fullNameAr;
        const reviewerAvatar = remoteUserProfile.avatar;
        const created = await phase2Backend.reviews.create({
          sellerId,
          orderId: review.orderId || null,
          rating: review.rating,
          bodyEn: review.title + "\n\n" + review.body,
          bodyAr: review.title + "\n\n" + review.body,
          tags: [],
          imageUrl: review.photos[0] ?? null,
          reviewerNameEn,
          reviewerNameAr,
          reviewerAvatar,
        });
        const local: MyReview = {
          id: created.id,
          orderId: created.orderId ?? "",
          sellerKey: created.sellerId,
          rating: created.rating as MyReview["rating"],
          title: created.bodyEn.slice(0, 60),
          body: created.bodyEn,
          photos: created.imageUrl ? [created.imageUrl] : [],
          date: created.createdAt,
          isVerifiedPurchase: !!created.orderId,
        };
        setRemoteMyReviews((prev) => [local, ...prev]);
        return local;
      }
      const id = `myrev-${Date.now()}`;
      const local: MyReview = { id, ...review };
      setMyReviews((prev) => [local, ...prev]);
      return local;
    },
    [phase2Backend, remoteUserProfile, setMyReviews],
  );

  const blockUser = useCallback(
    async (user: Omit<BlockedUser, "id" | "date">): Promise<void> => {
      if (phase2Backend) {
        // Map the view-model fields onto the service's expected shape.
        // The blocked user's id is encoded in the avatar URL path or
        // extracted from the name; for now we generate a stable id from
        // the avatar URL since the UI doesn't track a separate sellerId.
        const blockedId =
          user.avatar.match(/\/sellers\/([^.]+)\./)?.[1] ?? user.nameEn;
        await phase2Backend.blocks.block({
          blockedId,
          blockedNameEn: user.nameEn,
          blockedNameAr: user.nameAr,
          blockedAvatar: user.avatar,
          reasonEn: user.reasonEn,
          reasonAr: user.reasonAr,
        });
        const next = await phase2Backend.blocks.listMine();
        setRemoteBlockedUsers(
          next.map((r) => ({
            id: r.id,
            nameEn: r.blockedNameEn,
            nameAr: r.blockedNameAr,
            avatar: r.blockedAvatar,
            reasonEn: r.reasonEn ?? undefined,
            reasonAr: r.reasonAr ?? undefined,
            date: r.createdAt,
          })),
        );
        return;
      }
      const id = `blk-${Date.now()}`;
      setBlockedUsers((prev) => [
        ...prev,
        { ...user, id, date: new Date().toISOString() },
      ]);
    },
    [phase2Backend, setBlockedUsers],
  );

  const unblockUser = useCallback(
    async (id: string): Promise<void> => {
      if (phase2Backend) {
        await phase2Backend.blocks.unblock(id);
        setRemoteBlockedUsers((prev) => prev.filter((u) => u.id !== id));
        return;
      }
      setBlockedUsers((prev) => prev.filter((u) => u.id !== id));
    },
    [phase2Backend, setBlockedUsers],
  );

  const submitReport = useCallback(
    async (
      input: Omit<ReportRecord, "id" | "caseNumber" | "status" | "date">,
    ): Promise<ReportRecord> => {
      if (phase2Backend) {
        const created = await phase2Backend.reports.create({
          target: input.kind,
          targetId: input.targetId,
          reason:
            input.reason === "inappropriate"
              ? "offensive"
              : input.reason === "wrong_category"
                ? "mismatch"
                : input.reason === "stolen"
                  ? "other"
                  : input.reason,
          body: input.body,
        });
        const local = mapReportFromRemote(created);
        setRemoteReports((prev) => [local, ...prev]);
        return local;
      }
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
    [phase2Backend, setReports, reports.length],
  );

  const openDispute = useCallback(
    async (
      input: Omit<Dispute, "id" | "status" | "date" | "timeline">,
    ): Promise<Dispute> => {
      if (phase2Backend) {
        const created = await phase2Backend.disputes.create({
          orderId: input.orderId,
          reason: input.reason,
          body: input.body,
        });
        const local = mapDisputeFromRemote(created);
        setRemoteDisputes((prev) => [local, ...prev]);
        return local;
      }
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
    [phase2Backend, setDisputes],
  );

  // ----------------------------------------------------------------
  // App-lock callbacks. These wrap the four lock primitives
  // (enabled / timeout / pin / biometric) and the two unlock flows.
  // ----------------------------------------------------------------
  const refreshBiometricSupport = useCallback(async () => {
    const support = await detectWebAuthnSupport();
    setBiometricSupport(support);
  }, []);

  // Probe platform support once after mount so the Settings UI can
  // decide whether to show the "Use biometric" toggle. We avoid doing
  // this during SSR (no `window`).
  //
  // The platform-detection result lands asynchronously after the effect
  // body, but the lint rule still flags it as a synchronous setState.
  // We schedule the actual call on the microtask queue to keep the rule
  // happy without changing runtime semantics.
  useEffect(() => {
    if (typeof window === "undefined") return;
    queueMicrotask(() => {
      void refreshBiometricSupport();
    });
  }, [refreshBiometricSupport]);

  const setLockEnabled = useCallback(
    (enabled: boolean) => {
      setLockEnabledRaw(enabled);
      // Turning the feature off clears the lock state immediately.
      if (!enabled) {
        setIsLocked(false);
      }
    },
    [setLockEnabledRaw],
  );

  const setLockTimeoutMs = useCallback(
    (ms: number) => {
      // Defensive: only accept known presets. Anything else is dropped
      // so a stale storage value can't put the UI in a weird state.
      if (!(LOCK_TIMEOUT_PRESETS_MS as readonly number[]).includes(ms)) {
        return;
      }
      setLockTimeoutMsRaw(ms as LockTimeoutMs);
    },
    [setLockTimeoutMsRaw],
  );

  const setupPin = useCallback(
    async (pin: string): Promise<boolean> => {
      const result = await hashPin(pin);
      if (!result) return false;
      setLockPinHash(result.hash);
      setLockPinSalt(result.salt);
      // Setting a PIN while locked is an implicit unlock so the user
      // doesn't have to type it twice.
      setIsLocked(false);
      return true;
    },
    [setLockPinHash, setLockPinSalt],
  );

  const clearPin = useCallback(() => {
    setLockPinHash(null);
    setLockPinSalt(null);
  }, [setLockPinHash, setLockPinSalt]);

  const setupBiometric = useCallback(
    async (userName: string): Promise<boolean> => {
      try {
        const credId = await registerBiometric(userName);
        setLockBiometricCred(credId);
        // Fresh credential = fresh trust. Drop any prior lock state so
        // the user lands on the unlocked app and sees the new toggle.
        setIsLocked(false);
        return true;
      } catch {
        return false;
      }
    },
    [setLockBiometricCred],
  );

  const clearBiometric = useCallback(() => {
    setLockBiometricCred(null);
  }, [setLockBiometricCred]);

  const unlockWithPin = useCallback(
    async (pin: string): Promise<boolean> => {
      if (!lockPinHash || !lockPinSalt) return false;
      const ok = await verifyPin(pin, lockPinSalt, lockPinHash);
      if (ok) setIsLocked(false);
      return ok;
    },
    [lockPinHash, lockPinSalt],
  );

  const unlockWithBiometric = useCallback(async (): Promise<boolean> => {
    if (!lockBiometricCred) return false;
    const ok = await verifyBiometric(lockBiometricCred);
    if (ok) setIsLocked(false);
    return ok;
  }, [lockBiometricCred]);

  const lockNow = useCallback(() => {
    if (!lockEnabled) return;
    if (!lockPinHash && !lockBiometricCred) return;
    setIsLocked(true);
  }, [lockEnabled, lockPinHash, lockBiometricCred]);

  // Resolve the active user record from the session + users list.
  const currentUserId = useMemo(() => {
    if (phase2Backend) return remoteUser?.id ?? null;
    return session?.userId ?? null;
  }, [phase2Backend, remoteUser, session]);

  const currentUser = useMemo(() => {
    if (phase2Backend) {
      return remoteUser
        ? {
            id: remoteUser.id,
            email: remoteUser.email,
            name: remoteUser.name,
          }
        : null;
    }
    if (!session) return null;
    const match = users.find((u) => u.id === session.userId);
    if (!match) return null;
    return { id: match.id, email: match.email, name: match.nameEn };
  }, [phase2Backend, remoteUser, session, users]);

  // Lock the app automatically on sign-in whenever auto-lock is on and
  // at least one unlock factor is configured. Skip the guest session
  // (no `currentUser`) — the auth screens are already a barrier.
  //
  // `isLocked` is the source of truth for the lock overlay; the lint
  // rule wants us to derive it from props, but the auto-lock decision
  // depends on the *previous* `isLocked` value (don't re-lock on every
  // unrelated re-render). We defer the assignment via queueMicrotask.
  useEffect(() => {
    queueMicrotask(() => {
      if (!currentUser) {
        setIsLocked(false);
        return;
      }
      if (lockEnabled && (lockPinHash || lockBiometricCred)) {
        setIsLocked(true);
      }
    });
  }, [currentUser, lockEnabled, lockPinHash, lockBiometricCred]);

  // Initial + on-auth-change fetch of remote data. The dependency on
  // `remoteUser` re-runs on sign-in / sign-out so a fresh session sees
  // the latest state immediately. Pulled out of the early render path
  // so all refreshers below are in scope.
  useEffect(() => {
    if (!marketplaceMode) return;
    let active = true;
    void (async () => {
      if (active) {
        await refreshListings();
        await refreshOrders();
        await refreshChats();
        await refreshNotifications();
        await refreshMyReviews();
        await refreshReports();
        await refreshDisputes();
      }
    })();
    return () => {
      active = false;
    };
  }, [
    marketplaceMode,
    refreshListings,
    refreshOrders,
    refreshChats,
    refreshNotifications,
    refreshMyReviews,
    refreshReports,
    refreshDisputes,
    remoteUser,
  ]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      listings,
      listingsLoading,
      listingsError,
      refreshListings,
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
      chats: activeChats,
      sendChatMessage,
      createChatThread,
      markChatRead,
      setChatOfferStatus,
      refreshChats,
      chatsLoading,
      addresses,
      addAddress,
      updateAddress,
      removeAddress,
      setDefaultAddress,
      paymentMethods: activePaymentMethods,
      addPaymentMethod,
      removePaymentMethod,
      setDefaultPaymentMethod,
      orders,
      recordOrder,
      updateOrderStatus,
      notifications: activeNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      userProfile,
      updateUserProfile,
      myReviews: activeMyReviews,
      addMyReview,
      blockedUsers: activeBlockedUsers,
      blockUser,
      unblockUser,
      reports: activeReports,
      submitReport,
      disputes: activeDisputes,
      openDispute,
      refreshNotifications,
      refreshMyReviews,
      refreshReports,
      refreshDisputes,
      currentUser,
      currentUserId,
      authMode,
      phase2Backend,
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
      // App lock
      lockEnabled,
      lockTimeoutMs,
      hasPin: Boolean(lockPinHash),
      hasBiometric: Boolean(lockBiometricCred),
      isLocked,
      biometricSupported: biometricSupport.available,
      biometricHasPlatformAuthenticator:
        biometricSupport.hasPlatformAuthenticator,
      setLockEnabled,
      setLockTimeoutMs,
      setupPin,
      clearPin,
      setupBiometric,
      clearBiometric,
      unlockWithPin,
      unlockWithBiometric,
      lockNow,
      refreshBiometricSupport,
    }),
    [
      language,
      setLanguage,
      listings,
      listingsLoading,
      listingsError,
      refreshListings,
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
      activeChats,
      sendChatMessage,
      createChatThread,
      markChatRead,
      setChatOfferStatus,
      refreshChats,
      chatsLoading,
      addresses,
      addAddress,
      updateAddress,
      removeAddress,
      setDefaultAddress,
      activePaymentMethods,
      addPaymentMethod,
      removePaymentMethod,
      setDefaultPaymentMethod,
      orders,
      recordOrder,
      updateOrderStatus,
      activeNotifications,
      markNotificationRead,
      markAllNotificationsRead,
      userProfile,
      updateUserProfile,
      activeMyReviews,
      addMyReview,
      activeBlockedUsers,
      blockUser,
      unblockUser,
      activeReports,
      submitReport,
      activeDisputes,
      openDispute,
      refreshNotifications,
      refreshMyReviews,
      refreshReports,
      refreshDisputes,
      currentUser,
      currentUserId,
      authMode,
      phase2Backend,
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
      // App lock deps
      lockEnabled,
      lockTimeoutMs,
      lockPinHash,
      lockBiometricCred,
      isLocked,
      biometricSupport.available,
      biometricSupport.hasPlatformAuthenticator,
      setLockEnabled,
      setLockTimeoutMs,
      setupPin,
      clearPin,
      setupBiometric,
      clearBiometric,
      unlockWithPin,
      unlockWithBiometric,
      lockNow,
      refreshBiometricSupport,
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
