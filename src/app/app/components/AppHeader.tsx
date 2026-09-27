import React from "react";
import { ViewState, TabId } from "@/types/navigation";
import { AuthenticatedUser } from "@/services/backend";
import { User } from "@/data/users";

interface AppHeaderProps {
  isAr: boolean;
  currentUser: { id?: string; email: string; name: string } | null;
  cartCount: number;
  setView: (view: ViewState) => void;
  changeTab: (tab: TabId) => void;
  setAuthSheetOpen: (open: boolean) => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  isAr,
  currentUser,
  cartCount,
  setView,
  changeTab,
  setAuthSheetOpen,
}) => {
  return (
    <header
      data-testid="app-header"
      className="app-shell-header sticky top-0 z-50 grid w-full grid-cols-[88px_minmax(0,1fr)_88px] items-center border-b border-surface-container-high bg-surface/90 px-margin-mobile pb-md backdrop-blur-md"
    >
      <div className="flex items-center gap-0">
        {/* Menu / Settings */}
        <button
          type="button"
          onClick={() => setView("settings")}
          className="flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container-low active:scale-95"
          aria-label={isAr ? "الإعدادات" : "Settings"}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            aria-hidden="true"
          >
            settings
          </span>
        </button>
        {/* Account — AuthSheet when guest, Settings when signed in */}
        <button
          type="button"
          onClick={() => {
            if (currentUser) setView("settings");
            else setAuthSheetOpen(true);
          }}
          className="flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container-low active:scale-95"
          aria-label={
            currentUser
              ? isAr
                ? "الحساب"
                : "Account"
              : isAr
                ? "تسجيل الدخول"
                : "Sign in"
          }
          data-testid="header-account"
        >
          {currentUser ? (
            <span
              className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-[12px] font-bold text-on-primary"
              aria-hidden="true"
            >
              {(currentUser.name || currentUser.email || "?").charAt(0).toUpperCase()}
            </span>
          ) : (
            <span
              className="material-symbols-outlined text-[24px]"
              aria-hidden="true"
            >
              person
            </span>
          )}
        </button>
      </div>

      {/* Title Logo */}
      <h1 className="min-w-0 text-center font-serif text-display-lg-mobile italic tracking-widest text-primary">
        <button
          type="button"
          onClick={() => changeTab("home")}
          className="rounded-lg px-2 py-1 transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          aria-label={isAr ? "العودة إلى الرئيسية" : "Go to Home"}
        >
          Mooday
        </button>
      </h1>

      <div className="flex items-center justify-end gap-0">
        <button
          type="button"
          onClick={() => setView("notifications")}
          className="flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container-low active:scale-95"
          aria-label={isAr ? "الإشعارات" : "Notifications"}
          data-testid="header-notifications"
        >
          <span
            className="material-symbols-outlined text-[24px]"
            aria-hidden="true"
          >
            notifications
          </span>
        </button>
        {/* Shopping Bag */}
        <button
          type="button"
          onClick={() => setView("bag")}
          className="relative flex h-11 w-11 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container-low active:scale-95"
          aria-label={isAr ? "حقيبة التسوق" : "Shopping Bag"}
        >
          <span
            className="material-symbols-outlined text-[24px]"
            aria-hidden="true"
          >
            shopping_bag
          </span>
          {cartCount > 0 && (
            <span className="absolute end-0 top-0 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 font-sans text-[10px] font-bold text-on-primary">
              {cartCount > 9 ? "9+" : cartCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
