"use client";

import React from "react";
import { useApp } from "@/context/AppContext";

interface SettingsViewProps {
  onBack: () => void;
  onOpenEditProfile?: () => void;
  onOpenAddresses?: () => void;
  onOpenPaymentMethods?: () => void;
  onOpenHelp?: () => void;
  onOpenPayouts?: () => void;
  onOpenBlockedUsers?: () => void;
  onSignOut?: () => void;
  onSignIn?: () => void;
}

interface SettingItem {
  labelEn: string;
  labelAr: string;
  valueEn?: string;
  valueAr?: string;
  icon: string;
  isSelect?: boolean;
  isToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (v: boolean) => void;
  onNavigate?: () => void;
}

interface SettingSection {
  titleEn: string;
  titleAr: string;
  items: SettingItem[];
}

interface SettingsCopy {
  title: string;
  back: string;
  languageLabel: string;
  languageEn: string;
  languageAr: string;
  account: string;
  preferences: string;
  privacySafety: string;
  about: string;
  blockedUsers: string;
  blockedUsersValue: string;
  signOut: string;
  signOutHint: string;
  clearCache: string;
  clearCacheHint: string;
  versionLabel: string;
}

const COPY: Record<"en" | "ar", SettingsCopy> = {
  en: {
    title: "Settings & Account",
    back: "Back",
    languageLabel: "Language",
    languageEn: "English",
    languageAr: "العربية (RTL)",
    account: "Account",
    preferences: "Preferences",
    privacySafety: "Privacy & Safety",
    about: "About",
    blockedUsers: "Blocked users",
    blockedUsersValue: "Manage the people you've blocked",
    signOut: "Log Out",
    signOutHint: "Sign out of your Mooday account",
    clearCache: "Clear cached images",
    clearCacheHint: "Frees up ~3 MB on your device",
    versionLabel: "Version",
  },
  ar: {
    title: "الإعدادات والحساب",
    back: "رجوع",
    languageLabel: "اللغة",
    languageEn: "English",
    languageAr: "العربية (RTL)",
    account: "الحساب",
    preferences: "التفضيلات",
    privacySafety: "الخصوصية والأمان",
    about: "حول",
    blockedUsers: "المحظورون",
    blockedUsersValue: "إدارة من حظرتهم",
    signOut: "تسجيل الخروج",
    signOutHint: "تسجيل الخروج من حسابك في مودي",
    clearCache: "مسح الصور المخزنة",
    clearCacheHint: "يحرر ~٣ ميجابايت",
    versionLabel: "الإصدار",
  },
};

/**
 * G-37 — Settings (expanded).
 *
 * Five sections with deep-link entry points to the new management views
 * (G-33 Edit Profile, G-35 Addresses, G-36 Payment Methods, G-38 Help)
 * plus the still-placeholder Trust row (H-43 Blocked users).
 *
 * The language picker is real; sign-out and clear-cache are intentional
 * no-ops for Phase 1 (logged in `signOutHint` / `clearCacheHint`).
 */
export const SettingsView: React.FC<SettingsViewProps> = ({
  onBack,
  onOpenEditProfile,
  onOpenAddresses,
  onOpenPaymentMethods,
  onOpenHelp,
  onOpenPayouts,
  onOpenBlockedUsers,
  onSignOut,
  onSignIn,
}) => {
  const { language, setLanguage, currentUser } = useApp();
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as "en" | "ar");
  };

  const sections: SettingSection[] = [
    {
      titleEn: t.account,
      titleAr: t.account,
      items: [
        {
          labelEn: "Edit profile",
          labelAr: "تعديل الملف",
          valueEn: isAr ? "فاطمة المنصوري" : "Fatima AlMansoori",
          valueAr: isAr ? "فاطمة المنصوري" : "Fatima AlMansoori",
          icon: "person",
          onNavigate: onOpenEditProfile,
        },
        {
          labelEn: "Saved addresses",
          labelAr: "العناوين",
          icon: "home",
          onNavigate: onOpenAddresses,
        },
        {
          labelEn: "Payment methods",
          labelAr: "طرق الدفع",
          icon: "credit_card",
          onNavigate: onOpenPaymentMethods,
        },
        {
          labelEn: "Payouts",
          labelAr: "المدفوعات",
          icon: "account_balance",
          onNavigate: onOpenPayouts,
        },
      ],
    },
    {
      titleEn: t.preferences,
      titleAr: t.preferences,
      items: [
        {
          labelEn: t.languageLabel,
          labelAr: t.languageLabel,
          valueEn: t.languageEn,
          valueAr: t.languageAr,
          icon: "translate",
          isSelect: true,
        },
        {
          labelEn: "Push notifications",
          labelAr: "الإشعارات",
          icon: "notifications",
          isToggle: true,
          toggleValue: true,
        },
        {
          labelEn: "Dark mode",
          labelAr: "الوضع الداكن",
          icon: "dark_mode",
          isToggle: true,
          toggleValue: false,
        },
      ],
    },
    {
      titleEn: t.privacySafety,
      titleAr: t.privacySafety,
      items: [
        {
          labelEn: t.blockedUsers,
          labelAr: t.blockedUsers,
          icon: "block",
          valueEn: t.blockedUsersValue,
          valueAr: t.blockedUsersValue,
          onNavigate: onOpenBlockedUsers,
        },
        {
          labelEn: "Mooday Safe Escrow Policy",
          labelAr: "سياسة ضمان مودي الآمن",
          icon: "shield",
        },
      ],
    },
    {
      titleEn: t.about,
      titleAr: t.about,
      items: [
        {
          labelEn: t.clearCache,
          labelAr: t.clearCache,
          icon: "cleaning_services",
          valueEn: t.clearCacheHint,
          valueAr: t.clearCacheHint,
        },
        {
          labelEn: "Help & Support",
          labelAr: "المساعدة والدعم",
          icon: "help",
          onNavigate: onOpenHelp,
        },
        {
          labelEn: t.versionLabel,
          labelAr: t.versionLabel,
          icon: "info",
          valueEn: "Mooday 1.0.0",
          valueAr: "مودي 1.0.0",
        },
      ],
    },
  ];

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="w-full max-w-[800px] mx-auto flex flex-col gap-lg pb-10"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant pb-4">
        <button
          type="button"
          onClick={onBack}
          aria-label={t.back}
          className="text-on-surface hover:bg-surface-container-low transition-colors rounded-full p-2 flex items-center justify-center active:scale-95"
        >
          <span
            className="material-symbols-outlined no-mirror"
            aria-hidden="true"
          >
            arrow_back
          </span>
        </button>
        <h1 className="font-serif text-headline-sm text-primary tracking-widest uppercase flex-grow text-center">
          {t.title}
        </h1>
        <div className="w-10" aria-hidden="true" />
      </div>

      <main className="flex flex-col gap-lg mt-md font-sans">
        {sections.map((section, idx) => (
          <div key={idx} className="flex flex-col gap-sm">
            <h3 className="text-label-md uppercase tracking-wider text-primary font-bold px-md">
              {section.titleEn}
            </h3>

            <div className="bg-surface-container-low border border-surface-container-high rounded-xl overflow-hidden flex flex-col">
              {section.items.map((item, itemIdx) => (
                <button
                  key={itemIdx}
                  type="button"
                  disabled={
                    !item.onNavigate && !item.isSelect && !item.isToggle
                  }
                  onClick={
                    item.onNavigate
                      ? item.onNavigate
                      : item.isToggle && item.onToggle
                        ? () => item.onToggle!(!item.toggleValue)
                        : undefined
                  }
                  aria-label={`${isAr ? item.labelAr : item.labelEn}${
                    item.valueEn && !item.isSelect
                      ? ` — ${isAr ? item.valueAr : item.valueEn}`
                      : ""
                  }`}
                  className="flex items-center justify-between p-md border-b border-surface-container-high last:border-b-0 w-full text-start active:bg-surface-container-high transition-colors disabled:cursor-default"
                >
                  <div className="flex items-center gap-md min-w-0">
                    <span
                      className="material-symbols-outlined text-outline no-mirror"
                      aria-hidden="true"
                    >
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <span className="block text-body-lg text-on-surface font-bold">
                        {isAr ? item.labelAr : item.labelEn}
                      </span>
                      {item.valueEn && !item.isSelect && !item.isToggle && (
                        <span className="block text-label-sm text-on-surface-variant line-clamp-1">
                          {isAr ? item.valueAr : item.valueEn}
                        </span>
                      )}
                    </div>
                  </div>

                  {item.isSelect ? (
                    <select
                      value={language}
                      onClick={(e) => e.stopPropagation()}
                      onChange={handleLanguageChange}
                      className="bg-surface border border-outline-variant rounded-lg p-sm text-label-sm font-bold text-primary outline-none focus:border-primary"
                    >
                      <option value="en">English</option>
                      <option value="ar">العربية</option>
                    </select>
                  ) : item.isToggle ? (
                    <span
                      className={`relative w-10 h-6 rounded-full flex-shrink-0 transition-colors ${
                        item.toggleValue
                          ? "bg-primary"
                          : "bg-surface-container-high"
                      }`}
                      aria-hidden="true"
                    >
                      <span
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          item.toggleValue
                            ? isAr
                              ? "right-5"
                              : "right-1"
                            : isAr
                              ? "right-5"
                              : "left-1"
                        }`}
                      />
                    </span>
                  ) : item.valueEn && !item.onNavigate ? (
                    <span className="text-label-sm text-on-surface-variant text-end max-w-[40%] truncate">
                      {isAr ? item.valueAr : item.valueEn}
                    </span>
                  ) : (
                    <span
                      className="material-symbols-outlined text-outline text-[20px]"
                      aria-hidden="true"
                    >
                      chevron_right
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Log out / Sign in — Phase 1 Group A wires auth state. */}
        {currentUser ? (
          <button
            type="button"
            onClick={onSignOut}
            title={t.signOutHint}
            className="border border-error text-error hover:bg-error/5 active:scale-95 transition-all text-label-sm uppercase tracking-widest font-bold py-4 rounded-xl text-center mt-md"
          >
            {t.signOut}
          </button>
        ) : (
          <button
            type="button"
            onClick={onSignIn}
            className="border border-primary text-primary hover:bg-primary/5 active:scale-95 transition-all text-label-sm uppercase tracking-widest font-bold py-4 rounded-xl text-center mt-md"
          >
            {isAr ? "تسجيل الدخول" : "Sign in"}
          </button>
        )}
      </main>
    </div>
  );
};
