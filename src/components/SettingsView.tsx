"use client";

import React from "react";
import { useApp } from "@/context/AppContext";

interface SettingsViewProps {
  onBack: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onBack }) => {
  const { language, setLanguage } = useApp();
  const isAr = language === "ar";

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLanguage(e.target.value as "en" | "ar");
  };

  interface SettingItem {
    labelEn: string;
    labelAr: string;
    valueEn?: string;
    valueAr?: string;
    icon: string;
    isSelect?: boolean;
  }

  interface SettingSection {
    titleEn: string;
    titleAr: string;
    items: SettingItem[];
  }

  const sections: SettingSection[] = [
    {
      titleEn: "Account Preferences",
      titleAr: "تفضيلات الحساب",
      items: [
        {
          labelEn: "Personal Info",
          labelAr: "المعلومات الشخصية",
          valueEn: "Fatima AlMansoori",
          valueAr: "فاطمة المنصوري",
          icon: "person",
        },
        {
          labelEn: "Language",
          labelAr: "اللغة",
          valueEn: "English",
          valueAr: "العربية",
          icon: "translate",
          isSelect: true,
        },
      ],
    },
    {
      titleEn: "Security & Policy",
      titleAr: "الأمان والسياسة",
      items: [
        { labelEn: "Security & Password", labelAr: "الأمان وكلمة المرور", icon: "security" },
        { labelEn: "Privacy Policy", labelAr: "سياسة الخصوصية", icon: "policy" },
        { labelEn: "Mooday Safe Escrow Policy", labelAr: "سياسة ضمان مودي الآمن", icon: "shield" },
      ],
    },
  ];

  return (
    <div className="w-full max-w-[800px] mx-auto flex flex-col gap-lg pb-10">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-outline-variant pb-4">
        <button
          onClick={onBack}
          aria-label="Back"
          className="text-on-surface hover:bg-surface-container-low transition-colors rounded-full p-2 flex items-center justify-center active:scale-95"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="font-serif text-headline-sm text-primary tracking-widest uppercase text-center flex-grow">
          {isAr ? "الإعدادات والحساب" : "Settings & Account"}
        </div>
        <div className="w-10"></div>
      </div>

      {/* Settings list */}
      <main className="flex flex-col gap-lg mt-md font-sans">
        {sections.map((section, idx) => (
          <div key={idx} className="flex flex-col gap-sm">
            <h3 className="text-label-md uppercase tracking-wider text-primary font-bold px-md">
              {isAr ? section.titleAr : section.titleEn}
            </h3>

            <div className="bg-surface-container-low border border-surface-container-high rounded-xl overflow-hidden flex flex-col">
              {section.items.map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className="flex items-center justify-between p-md border-b border-surface-container-high last:border-b-0"
                >
                  <div className="flex items-center gap-md">
                    <span className="material-symbols-outlined text-outline">
                      {item.icon}
                    </span>
                    <span className="text-body-lg text-on-surface font-bold">
                      {isAr ? item.labelAr : item.labelEn}
                    </span>
                  </div>

                  {item.isSelect ? (
                    <select
                      value={language}
                      onChange={handleLanguageChange}
                      className="bg-surface border border-outline-variant rounded-lg p-sm text-label-sm font-bold text-primary outline-none focus:border-primary"
                    >
                      <option value="en">English</option>
                      <option value="ar">العربية (RTL)</option>
                    </select>
                  ) : item.valueEn ? (
                    <span className="text-label-sm text-on-surface-variant">
                      {isAr ? item.valueAr : item.valueEn}
                    </span>
                  ) : (
                    <span className="material-symbols-outlined text-outline text-[20px]">
                      chevron_right
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Log out */}
        <button className="border border-error text-error hover:bg-error/5 active:scale-95 transition-all text-label-sm uppercase tracking-widest font-bold py-4 rounded-xl text-center mt-md">
          {isAr ? "تسجيل الخروج" : "Log Out"}
        </button>
      </main>
    </div>
  );
};
