import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppContext, type AppContextType } from "@/context/AppContext";
import { LockScreen } from "@/components/LockScreen";

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
 signIn: vi.fn(() => true),
 signOut: vi.fn(),
 verifyOtp: vi.fn(() => true),
 sendOtp: vi.fn(() => "000000"),
 updateCurrentUserName: vi.fn(),
 resetPassword: vi.fn(() => true),
 ...overrides,
 } as AppContextType;
}

beforeEach(() => {
 localStorage.clear();
});

describe("LockScreen", () => {
 it("renders the lock headline and a PIN field when PIN is configured", () => {
 render(
 <AppContext.Provider
 value={makeContext({
 hasPin: true,
 unlockWithPin: vi.fn(async () => false),
 })}
 >
 <LockScreen />
 </AppContext.Provider>,
 );
 expect(screen.getByText(/Mooday is locked/i)).toBeInTheDocument();
 expect(screen.getByTestId("lock-pin-input")).toBeInTheDocument();
 });

 it("shows the biometric button when biometric is configured + supported", () => {
 render(
 <AppContext.Provider
 value={makeContext({
 hasBiometric: true,
 biometricHasPlatformAuthenticator: true,
 hasPin: true,
 unlockWithBiometric: vi.fn(async () => false),
 })}
 >
 <LockScreen />
 </AppContext.Provider>,
 );
 expect(screen.getByTestId("lock-biometric-button")).toBeInTheDocument();
 });

 it("does not show biometric when only PIN is configured", () => {
 render(
 <AppContext.Provider
 value={makeContext({
 hasPin: true,
 unlockWithPin: vi.fn(async () => false),
 })}
 >
 <LockScreen />
 </AppContext.Provider>,
 );
 expect(screen.queryByTestId("lock-biometric-button")).not.toBeInTheDocument();
 });

 it("unlocks when the PIN matches", async () => {
 const unlockWithPin = vi.fn(async (pin: string) => pin === "1234");
 const user = userEvent.setup();
 render(
 <AppContext.Provider
 value={makeContext({ hasPin: true, unlockWithPin })}
 >
 <LockScreen />
 </AppContext.Provider>,
 );

 await user.type(screen.getByTestId("lock-pin-input"), "1234");
 await user.click(screen.getByTestId("lock-pin-submit"));

 await waitFor(() => {
 expect(unlockWithPin).toHaveBeenCalledWith("1234");
 });
 });

 it("renders the Arabic headline when language is ar", () => {
 render(
 <AppContext.Provider
 value={makeContext({
 language: "ar",
 hasPin: true,
 unlockWithPin: vi.fn(async () => false),
 })}
 >
 <LockScreen />
 </AppContext.Provider>,
 );
 expect(screen.getByText(/مودي مقفله/i)).toBeInTheDocument();
 });
});
