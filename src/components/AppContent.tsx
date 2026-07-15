"use client";

import React from "react";
import type { AppNavigation } from "@/hooks/useAppNavigation";
import { useApp } from "@/context/AppContext";
import { DiscoverFeedView } from "./DiscoverFeedView";
import { ProductDetailsView } from "./ProductDetailsView";
import { ShoppingBagView } from "./ShoppingBagView";
import { CheckoutFlowView } from "./CheckoutFlowView";
import { UserProfileView } from "./UserProfileView";
import { ActivityView } from "./ActivityView";
import { SearchFiltersView } from "./SearchFiltersView";
import { SettingsView } from "./SettingsView";
import { SellItemView } from "./SellItemView";
import { ChatOverlay } from "./ChatOverlay";
import { PublicSellerProfile } from "./PublicSellerProfile";
import { CategoryLandingView } from "./CategoryLandingView";
import { MyPurchasesView } from "./MyPurchasesView";
import { OrderDetailsView } from "./OrderDetailsView";
import { SellModePickerView } from "./SellModePickerView";
import { MyClosetView } from "./MyClosetView";
import { EditListingView } from "./EditListingView";
import { MySalesView } from "./MySalesView";
import { NotificationsCentreView } from "./NotificationsCentreView";
import { ChatsListView } from "./ChatsListView";
import { SavedAddressesView } from "./SavedAddressesView";
import { SavedPaymentMethodsView } from "./SavedPaymentMethodsView";
import { EditProfileView } from "./EditProfileView";
import { HelpSupportView } from "./HelpSupportView";
import { LeaveReviewView } from "./LeaveReviewView";
import { MyReviewsView } from "./MyReviewsView";
import { ReportView } from "./ReportView";
import { ReturnRequestView } from "./ReturnRequestView";
import { PayoutsView } from "./PayoutsView";
import { BlockedUsersView } from "./BlockedUsersView";
import { DisputeView } from "./DisputeView";
import { DisputesListView } from "./DisputesListView";
import { SignUpView } from "./SignUpView";
import { OtpView } from "./OtpView";
import { SignInView } from "./SignInView";
import { ForgotPasswordView } from "./ForgotPasswordView";
import { SocialLoginView } from "./SocialLoginView";

interface AppContentProps {
  nav: AppNavigation;
}

/**
 * Renders the active view based on navigation state.
 *
 * This is the shared view-switching logic used by both the main app shell
 * (`/`) and the preview shell (`/preview`). The shell is responsible for
 * chrome (header, bottom nav, install prompt) and passes the navigation
 * state down to this component.
 */
export const AppContent: React.FC<AppContentProps> = ({ nav }) => {
  const {
    orders,
    updateOrderStatus,
    createChatThread,
    listings,
    disputes,
    language,
    signOut,
  } = useApp();
  const isAr = language === "ar";
  const {
    currentView,
    selectedProduct,
    checkoutProduct,
    activeChatThreadId,
    activeSellerId,
    activeCategory,
    activeSubCategory,
    activeCategorySort,
    activeOrderId,
    selectProduct,
    closeProduct,
    navigateToCart,
    startChat,
    closeChat,
    checkoutFromActiveChat,
    checkoutProductDirect,
    checkoutBack,
    checkoutSuccess,
    changeTab,
    goHome,
    setView,
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
  } = nav;

  if (selectedProduct) {
    return (
      <ProductDetailsView
        product={selectedProduct}
        onBack={closeProduct}
        onNavigateToCart={navigateToCart}
        onStartChat={startChat}
        onCheckoutProduct={checkoutProductDirect}
        onOpenSeller={openSeller}
      />
    );
  }

  if (activeChatThreadId) {
    return (
      <ChatOverlay
        threadId={activeChatThreadId}
        onBack={closeChat}
        onCheckout={checkoutFromActiveChat}
      />
    );
  }

  switch (currentView) {
    case "home":
      return (
        <DiscoverFeedView
          onSelectProduct={selectProduct}
          onNavigate={changeTab}
          onSelectCategory={openCategory}
        />
      );
    case "search":
      return (
        <SearchFiltersView onSelectProduct={selectProduct} onBack={goHome} />
      );
    case "sell":
      return <SellItemView onBack={goHome} onSuccess={goHome} />;
    case "sell-picker":
      return (
        <SellModePickerView onBack={goHome} onPickResell={openSellPicker} />
      );
    case "closet":
      return (
        <MyClosetView
          onBack={goHome}
          onEditListing={openEditListing}
          onCreateListing={openSellPicker}
          onSelectProduct={selectProduct}
        />
      );
    case "edit-listing": {
      const product = nav.activeListingId
        ? listings.find((p) => p.id === nav.activeListingId)
        : null;
      if (!product) {
        return (
          <MyClosetView
            onBack={goHome}
            onEditListing={openEditListing}
            onCreateListing={openSellPicker}
            onSelectProduct={selectProduct}
          />
        );
      }
      return (
        <EditListingView
          product={product}
          onBack={() => {
            closeEditListing();
          }}
          onSuccess={goHome}
        />
      );
    }
    case "sales":
      return (
        <MySalesView onBack={goHome} onOpenOrder={(id) => nav.openOrder(id)} />
      );
    case "notifications":
      return (
        <NotificationsCentreView
          onBack={goHome}
          onOpenChat={openChat}
          onOpenProduct={(id) => {
            const product = listings.find((item) => item.id === id);
            if (product) selectProduct(product);
          }}
          onOpenSeller={openSeller}
        />
      );
    case "chats":
      return (
        <ChatsListView
          onBack={() => {
            changeTab("profile");
          }}
          onOpenThread={openChat}
        />
      );
    case "edit-profile":
      return <EditProfileView onBack={closeEditProfile} />;
    case "addresses":
      return <SavedAddressesView onBack={closeAddresses} />;
    case "payment-methods":
      return <SavedPaymentMethodsView onBack={closePaymentMethods} />;
    case "help":
      return (
        <HelpSupportView
          onBack={closeHelp}
          onOpenOrder={(id) => nav.openOrder(id)}
        />
      );
    case "leave-review": {
      const order = nav.activeOrderId
        ? (orders.find((o) => o.id === nav.activeOrderId) ?? null)
        : null;
      if (!order) {
        return (
          <DisputesListView
            onBack={closeLeaveReview}
            onOpenDispute={(id) => openDispute()}
          />
        );
      }
      return <LeaveReviewView order={order} onBack={closeLeaveReview} />;
    }
    case "my-reviews":
      return <MyReviewsView onBack={closeMyReviews} />;
    case "report": {
      const order = nav.activeOrderId
        ? (orders.find((o) => o.id === nav.activeOrderId) ?? null)
        : null;
      if (order) {
        return (
          <ReportView
            orderId={order.id}
            targetId={order.lineItems[0]?.product.id}
            onBack={closeReport}
          />
        );
      }
      return <ReportView onBack={closeReport} />;
    }
    case "return-request": {
      const order = nav.activeOrderId
        ? (orders.find((o) => o.id === nav.activeOrderId) ?? null)
        : null;
      if (!order) {
        return (
          <ReturnRequestView
            order={{
              id: "",
              dateOrdered: "",
              status: "processing",
              lineItems: [],
              addressCityEn: "",
              addressCityAr: "",
              addressStreetEn: "",
              addressStreetAr: "",
              paymentBrandEn: "Visa",
              paymentBrandAr: "فيزا",
              paymentLast4: "",
              subtotal: 0,
              shipping: 0,
              total: 0,
              courier: { nameEn: "", nameAr: "", trackingNumber: "" },
              timeline: [],
            }}
            onBack={closeReturnRequest}
          />
        );
      }
      return <ReturnRequestView order={order} onBack={closeReturnRequest} />;
    }
    case "payouts":
      return <PayoutsView onBack={closePayouts} />;
    case "blocked-users":
      return <BlockedUsersView onBack={closeBlockedUsers} />;
    case "dispute": {
      const order = nav.activeOrderId
        ? (orders.find((o) => o.id === nav.activeOrderId) ?? null)
        : null;
      if (!order) {
        return (
          <DisputesListView
            onBack={closeDispute}
            onOpenDispute={(id) => openDispute()}
          />
        );
      }
      // Locate the dispute for this order (if any).
      const dispute = disputes.find((d) => d.orderId === order.id);
      return (
        <DisputeView
          order={order}
          dispute={dispute}
          onBack={closeDispute}
          onContactSupport={openHelp}
        />
      );
    }
    case "disputes-list":
      return (
        <DisputesListView
          onBack={closeDisputesList}
          onOpenDispute={(id) => {
            // For Phase 1 we just navigate back to a generic support view.
            // Phase 3 will wire to the dispute details.
            void id;
            closeDisputesList();
          }}
        />
      );
    case "signup":
      return (
        <SignUpView
          onBack={closeSignUp}
          onOtp={openOtp}
          onSignIn={openSignIn}
          onSuccess={() => {
            changeTab("home");
            setView("home");
          }}
        />
      );
    case "otp":
      return (
        <OtpView
          onBack={closeOtp}
          onSuccess={() => {
            changeTab("home");
            setView("home");
          }}
        />
      );
    case "signin":
      return (
        <SignInView
          onBack={closeSignIn}
          onSignUp={openSignUp}
          onForgotPassword={openForgotPassword}
          onSocialLogin={openSocialLogin}
          onSuccess={() => {
            changeTab("home");
            setView("home");
          }}
        />
      );
    case "forgot-password":
      return (
        <ForgotPasswordView
          onBack={closeForgotPassword}
          onSuccess={openSignIn}
        />
      );
    case "social-login":
      return (
        <SocialLoginView
          onBack={closeSocialLogin}
          onSignIn={openSignIn}
          onSuccess={() => {
            changeTab("home");
            setView("home");
          }}
        />
      );
    case "activity":
      return (
        <ActivityView
          onBack={goHome}
          onOpenChat={openChat}
          onOpenProduct={(id) => {
            const product = listings.find((item) => item.id === id);
            if (product) selectProduct(product);
          }}
          onOpenSeller={openSeller}
          onOpenNotifications={() => setView("notifications")}
        />
      );
    case "profile":
      return (
        <UserProfileView
          onSelectProduct={selectProduct}
          onOpenChat={openChat}
          onOpenPurchases={() => setView("purchases")}
          onOpenSales={() => setView("sales")}
          onOpenChats={() => setView("chats")}
        />
      );
    case "bag":
      return (
        <ShoppingBagView
          onBack={goHome}
          onCheckout={() => setView("checkout")}
        />
      );
    case "checkout":
      return (
        <CheckoutFlowView
          checkoutProduct={checkoutProduct}
          onBack={checkoutBack}
          onSuccess={checkoutSuccess}
        />
      );
    case "settings":
      return (
        <SettingsView
          onBack={goHome}
          onOpenEditProfile={openEditProfile}
          onOpenAddresses={openAddresses}
          onOpenPaymentMethods={openPaymentMethods}
          onOpenHelp={openHelp}
          onOpenPayouts={openPayouts}
          onOpenBlockedUsers={openBlockedUsers}
          onSignOut={() => {
            void Promise.resolve(signOut()).then(() => {
              changeTab("home");
              setView("home");
            });
          }}
          onSignIn={openSignIn}
        />
      );
    case "seller":
      if (!activeSellerId) {
        // Defensive: deep link with ?view=seller but no ?seller= id.
        return (
          <DiscoverFeedView
            onSelectProduct={selectProduct}
            onNavigate={changeTab}
            onSelectCategory={openCategory}
          />
        );
      }
      return (
        <PublicSellerProfile
          sellerId={activeSellerId}
          onBack={goHome}
          onSelectProduct={(p) => {
            closeSeller();
            selectProduct(p);
          }}
          onOpenChat={openChat}
          listings={nav.listings ?? []}
        />
      );
    case "category":
      if (!activeCategory) {
        // Defensive: deep link with ?view=category but no ?category= value.
        return (
          <DiscoverFeedView
            onSelectProduct={selectProduct}
            onNavigate={changeTab}
            onSelectCategory={openCategory}
          />
        );
      }
      return (
        <CategoryLandingView
          category={activeCategory}
          subCategory={activeSubCategory}
          sort={activeCategorySort}
          listings={nav.listings ?? []}
          onSubCategoryChange={setSubCategory}
          onSortChange={setCategorySort}
          onBack={closeCategory}
          onSelectProduct={selectProduct}
        />
      );
    case "purchases":
      return (
        <MyPurchasesView
          onBack={() => {
            changeTab("profile");
          }}
          onOpenOrder={openOrder}
          onContactSeller={(order) => {
            const product = order.lineItems[0]?.product;
            if (!product) return;
            openChat(createChatThread(product));
          }}
        />
      );
    case "order": {
      const order = nav.activeOrderId
        ? (orders.find((o) => o.id === nav.activeOrderId) ?? null)
        : null;
      if (!order) {
        return (
          <MyPurchasesView
            onBack={() => {
              changeTab("profile");
            }}
            onOpenOrder={openOrder}
          />
        );
      }
      return (
        <OrderDetailsView
          order={order}
          onBack={closeOrder}
          onSelectProduct={selectProduct}
          onMarkReceived={(id) => {
            updateOrderStatus(id, "delivered");
          }}
          onContactSeller={(product) => {
            const threadId = createChatThread(product);
            openChat(threadId);
          }}
          onLeaveReview={openLeaveReview}
          onReportOrder={openReport}
          onReturnRequest={openReturnRequest}
          onOpenDispute={openDispute}
          onOpenDisputesList={openDisputesList}
        />
      );
    }
    default:
      return (
        <DiscoverFeedView
          onSelectProduct={selectProduct}
          onNavigate={changeTab}
          onSelectCategory={openCategory}
        />
      );
  }
};
