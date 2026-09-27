import React from "react";
import { TabId } from "@/types/navigation";

interface BottomNavButtonProps {
  tab: TabId;
  activeTab: TabId;
  onClick: () => void;
  icon: string;
  label: string;
}

const BottomNavButton: React.FC<BottomNavButtonProps> = ({
  tab,
  activeTab,
  onClick,
  icon,
  label,
}) => {
  const isActive = activeTab === tab;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      aria-current={isActive ? "page" : undefined}
      className={`flex min-h-11 min-w-0 flex-col items-center justify-center px-1 py-1 transition-transform active:scale-95 ${
        isActive
          ? "text-primary font-bold"
          : "text-on-surface-variant opacity-60"
      }`}
    >
      <span
        className="material-symbols-outlined text-[26px] no-mirror"
        aria-hidden="true"
        style={{ fontVariationSettings: `'FILL' ${isActive ? 1 : 0}` }}
      >
        {icon}
      </span>
      <span className="text-[10px] uppercase tracking-widest mt-1">
        {label}
      </span>
    </button>
  );
};

interface BottomNavProps {
  isAr: boolean;
  activeTab: TabId;
  changeTab: (tab: TabId) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  isAr,
  activeTab,
  changeTab,
}) => {
  return (
    <nav
      data-testid="bottom-navigation"
      aria-label={isAr ? "التنقل الرئيسي" : "Primary navigation"}
      className="app-bottom-nav fixed bottom-0 z-40 grid grid-cols-5 items-center border-t border-surface-container-high bg-surface/95 px-sm shadow-lg backdrop-blur-md"
    >
      <BottomNavButton
        tab="home"
        activeTab={activeTab}
        onClick={() => changeTab("home")}
        icon="home"
        label={isAr ? "الرئيسية" : "Home"}
      />
      <BottomNavButton
        tab="search"
        activeTab={activeTab}
        onClick={() => changeTab("search")}
        icon="search"
        label={isAr ? "بحث" : "Search"}
      />

      {/* Elevated Sell Button */}
      <button
        type="button"
        onClick={() => changeTab("sell")}
        className="-mt-8 flex min-h-11 min-w-0 flex-col items-center justify-center transition-transform active:scale-95"
        aria-label={isAr ? "بيع" : "Sell"}
      >
        <div className="w-14 h-14 bg-primary text-on-primary rounded-full flex items-center justify-center shadow-xl btn-tactile border-4 border-surface">
          <span
            className="material-symbols-outlined text-[30px] no-mirror"
            aria-hidden="true"
          >
            add
          </span>
        </div>
        <span className="text-[10px] uppercase tracking-widest mt-1 text-primary font-bold">
          {isAr ? "بيع" : "Sell"}
        </span>
      </button>

      <BottomNavButton
        tab="activity"
        activeTab={activeTab}
        onClick={() => changeTab("activity")}
        icon="favorite"
        label={isAr ? "النشاط" : "Activity"}
      />
      <BottomNavButton
        tab="profile"
        activeTab={activeTab}
        onClick={() => changeTab("profile")}
        icon="person"
        label={isAr ? "الخزنة" : "Vault"}
      />
    </nav>
  );
};
