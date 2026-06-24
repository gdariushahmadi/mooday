"use client";

import React from "react";
import { useApp } from "@/context/AppContext";

interface ActivityViewProps {
  onBack: () => void;
  onNavigateToChats: () => void;
}

export const ActivityView: React.FC<ActivityViewProps> = ({
  onBack,
  onNavigateToChats,
}) => {
  const { language } = useApp();
  const isAr = language === "ar";

  const notifications = [
    {
      id: "1",
      type: "chat",
      titleEn: "New message from Sarah's Vintage",
      titleAr: "رسالة جديدة من عتيق سارة",
      descEn: "'Yes, it is still available. It's in excellent condition.'",
      descAr: "'نعم، لا تزال متوفرة. إنها في حالة ممتازة.'",
      timeEn: "10m ago",
      timeAr: "منذ ۱۰ دقائق",
      icon: "chat",
      isUnread: true,
      action: onNavigateToChats,
    },
    {
      id: "2",
      type: "offer",
      titleEn: "Price drop on Gold Silk Kaftan",
      titleAr: "انخفاض سعر قفطان الحرير الذهبي",
      descEn: "Amira Style reduced the price to AED 1,200 — save 50% off retail.",
      descAr: "خفضت أميرة ستايل السعر إلى 1200 درهم — وفر 50٪ من سعر التجزئة.",
      timeEn: "25m ago",
      timeAr: "منذ ۲۵ دقيقة",
      icon: "sell",
      isUnread: true,
    },
    {
      id: "3",
      type: "like",
      titleEn: "3 people saved your Emerald Abaya",
      titleAr: "۳ أشخاص حفظوا عباءتك الزمردية",
      descEn: "Your listed Emerald Evening Abaya is getting attention this week.",
      descAr: "عباءة السهرة الزمردية المعروضة تحظى باهتمام هذا الأسبوع.",
      timeEn: "1h ago",
      timeAr: "منذ ساعة",
      icon: "favorite",
      isUnread: true,
    },
    {
      id: "4",
      type: "follow",
      titleEn: "New Follower",
      titleAr: "متابع جديد",
      descEn: "Layla M. started following your closet.",
      descAr: "بدأت ليلى م. في متابعة خزانتك.",
      timeEn: "Yesterday",
      timeAr: "بالأمس",
      icon: "person_add",
      isUnread: false,
    },
    {
      id: "5",
      type: "offer",
      titleEn: "Offer Accepted!",
      titleAr: "تم قبول العرض!",
      descEn: "Hana Luxe accepted your offer for Classic Black Stiletto Heels.",
      descAr: "قبلت هنا لوكس عرضك لشراء الكعب الأسود الكلاسيكي.",
      timeEn: "2 days ago",
      timeAr: "منذ يومين",
      icon: "handshake",
      isUnread: false,
    },
    {
      id: "6",
      type: "like",
      titleEn: "Item Saved",
      titleAr: "تم حفظ منتج",
      descEn: "Tariq liked your listed Linen Midi Dress.",
      descAr: "أعجب طارق بفستانك الكتان ميدي المعروض.",
      timeEn: "3 days ago",
      timeAr: "منذ ۳ أيام",
      icon: "favorite",
      isUnread: false,
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
          {isAr ? "النشاطات والتنبيهات" : "Activity & Notifications"}
        </div>
        <div className="w-10"></div>
      </div>

      {/* Notifications list */}
      <main className="flex flex-col gap-sm mt-md font-sans">
        {notifications.map((notif) => (
          <div
            key={notif.id}
            onClick={notif.action}
            className={`border border-surface-container-high rounded-xl p-md flex items-start gap-md transition-colors ${
              notif.isUnread ? "bg-primary/5 hover:bg-primary/10" : "bg-surface-container-low hover:bg-surface-container-high"
            } ${notif.action ? "cursor-pointer" : ""}`}
          >
            {/* Icon */}
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              notif.isUnread ? "bg-primary text-on-primary" : "bg-surface-container-high text-outline"
            }`}>
              <span className="material-symbols-outlined text-[20px]">{notif.icon}</span>
            </div>

            {/* Content */}
            <div className="flex-grow min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h4 className={`text-label-md truncate ${notif.isUnread ? "font-bold text-on-surface" : "text-on-surface"}`}>
                  {isAr ? notif.titleAr : notif.titleEn}
                </h4>
                <span className="text-[11px] text-outline flex-shrink-0">{isAr ? notif.timeAr : notif.timeEn}</span>
              </div>
              <p className="text-body-md text-on-surface-variant line-clamp-2">
                {isAr ? notif.descAr : notif.descEn}
              </p>
            </div>

            {/* Unread indicator dot */}
            {notif.isUnread && (
              <div className="w-2.5 h-2.5 bg-primary rounded-full mt-2 self-start flex-shrink-0"></div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
};
