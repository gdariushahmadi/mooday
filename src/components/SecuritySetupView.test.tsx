import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import { SecuritySetupView } from "@/components/SecuritySetupView";

function makeContext(overrides: Partial<AppContextType> = {}): AppContextType {
 return {
 language: "en",
 setLanguage: vi.fn(),
 listings: [],
 addListing: vi.fn(),
 updateListing: vi.fn(),
 removeListing: vi.fn(),
 likes: [],
 toggleLike: vi.fn(),
 cart: [],
 addToCart: vi.fn(),
 removeFromCart: vi.fn(),
 updateQuantity: vi.fn(),
 clearCart: vi.fn(),
 chats: [],
 sendChatMessage: vi.fn(),
 createChatThread: vi.fn(() => "test-thread"),
 markChatRead: vi.fn(),
 setChatOfferStatus: vi.fn(),
 refreshChats: vi.fn(async () => {}),
 chatsLoading: false,
 refreshNotifications: vi.fn(async () => {}),
 refreshMyReviews: vi.fn(async () => {}),
 refreshReports: vi.fn(async () => {}),
 refreshDisputes: vi.fn(async () => {}),
 addresses: [],
 addAddress: vi.fn(),
 updateAddress: vi.fn(),
 removeAddress: vi.fn(),
 setDefaultAddress: vi.fn(),
 paymentMethods: [],
 addPaymentMethod: vi.fn(),
 removePaymentMethod: vi.fn(),
 setDefaultPaymentMethod: vi.fn(),
 orders: [],
 recordOrder: vi.fn(),
 updateOrderStatus: vi.fn(),
 notifications: [],
 markNotificationRead: vi.fn(),
 markAllNotificationsRead: vi.fn(),
 userProfile: {
 fullNameEn: "Test",
 fullNameAr: "اختبار",
 handle: "@t",
 avatar: "/a.jpg",
 bioEn: "b",
 bioAr: "b",
 locationEn: "Dubai",
 locationAr: "دبي",
 styleTagsEn: [],
 styleTagsAr: [],
 rating: 5,
 reviewsCount: 0,
 followers: 0,
 following: 0,
 },
 updateUserProfile: vi.fn(),
 myReviews: [],
 addMyReview: vi.fn(),
 blockedUsers: [],
 blockUser: vi.fn(),
 unblockUser: vi.fn(),
 reports: [],
 submitReport: vi.fn(),
 disputes: [],
 openDispute: vi.fn(),
 currentUser: null,
 authError: null,
 signUp: vi.fn(() => "user-test"),
 signIn: vi.fn(async () => true),
 signOut: vi.fn(),
 verifyOtp: vi.fn(() => true),
 sendOtp: vi.fn(() => "000000"),
 updateCurrentUserName: vi.fn(),
 resetPassword: vi.fn(async () => true),
 lockEnabled: false,
 setLockEnabled: vi.fn(),
 lockTimeoutMs: 5 * 60_000,
 setLockTimeoutMs: vi.fn(),
 hasPin: false,
 setupPin: vi.fn(async () => true),
 clearPin: vi.fn(),
 hasBiometric: false,
 biometricSupported: false,
 biometricHasPlatformAuthenticator: false,
 setupBiometric: vi.fn(async () => true),
 clearBiometric: vi.fn(),
 unlockWithPin: vi.fn(async () => true),
 unlockWithBiometric: vi.fn(async () => true),
 lockNow: vi.fn(),
 refreshBiometricSupport: vi.fn(async () => {}),
 ...overrides,
 } as AppContextType;
}

beforeEach(() => {
 localStorage.clear();
});

describe("SecuritySetupView", () => {
 it("toggles auto-lock via the master switch", async () => {
 const setLockEnabled = vi.fn();
 const user = userEvent.setup();
 render(
 <AppContext.Provider
 value={makeContext({ lockEnabled: false, setLockEnabled })}
 >
 <SecuritySetupView onBack={vi.fn()} />
 </AppContext.Provider>,
 );

 await user.click(screen.getByTestId("lock-master-toggle"));
 expect(setLockEnabled).toHaveBeenCalledWith(true);
 });

 it("only reveals timeout + biometric + PIN once auto-lock is on", () => {
 render(
 <AppContext.Provider
 value={makeContext({ lockEnabled: false })}
 >
 <SecuritySetupView onBack={vi.fn()} />
 </AppContext.Provider>,
 );
 expect(screen.queryByTestId("lock-timeout-select")).not.toBeInTheDocument();
 expect(screen.queryByTestId("lock-pin-set")).not.toBeInTheDocument();
 });

 it("saves a PIN when both fields match and are >= 4 digits", async () => {
 const setupPin = vi.fn(async () => true);
 const user = userEvent.setup();
 render(
 <AppContext.Provider
 value={makeContext({ lockEnabled: true, setupPin })}
 >
 <SecuritySetupView onBack={vi.fn()} />
 </AppContext.Provider>,
 );

 await user.click(screen.getByTestId("lock-pin-set"));
 await user.type(screen.getByTestId("lock-pin-new"), "1234");
 await user.type(screen.getByTestId("lock-pin-confirm"), "1234");
 await user.click(screen.getByTestId("lock-pin-save"));

 await waitFor(() => {
 expect(setupPin).toHaveBeenCalledWith("1234");
 });
 });

 it("rejects mismatched PINs before calling setupPin", async () => {
 const setupPin = vi.fn(async () => true);
 const user = userEvent.setup();
 render(
 <AppContext.Provider
 value={makeContext({ lockEnabled: true, setupPin })}
 >
 <SecuritySetupView onBack={vi.fn()} />
 </AppContext.Provider>,
 );

 await user.click(screen.getByTestId("lock-pin-set"));
 await user.type(screen.getByTestId("lock-pin-new"), "1234");
 await user.type(screen.getByTestId("lock-pin-confirm"), "9999");
 await user.click(screen.getByTestId("lock-pin-save"));

 expect(setupPin).not.toHaveBeenCalled();
 expect(screen.getByText(/PINs do not match/i)).toBeInTheDocument();
 });

 it("shows a Lock now button only when lock + unlock factors exist", () => {
 const { rerender } = render(
 <AppContext.Provider
 value={makeContext({ lockEnabled: true, hasPin: true })}
 >
 <SecuritySetupView onBack={vi.fn()} />
 </AppContext.Provider>,
 );
 expect(screen.getByTestId("lock-now")).toBeInTheDocument();

 rerender(
 <AppContext.Provider
 value={makeContext({ lockEnabled: true, hasPin: false })}
 >
 <SecuritySetupView onBack={vi.fn()} />
 </AppContext.Provider>,
 );
 expect(screen.queryByTestId("lock-now")).not.toBeInTheDocument();
 });

 it("calls lockNow when the Lock now button is pressed", async () => {
 const lockNow = vi.fn();
 const user = userEvent.setup();
 render(
 <AppContext.Provider
 value={makeContext({ lockEnabled: true, hasPin: true, lockNow })}
 >
 <SecuritySetupView onBack={vi.fn()} />
 </AppContext.Provider>,
 );
 await user.click(screen.getByTestId("lock-now"));
 expect(lockNow).toHaveBeenCalledTimes(1);
 });
});
