"use client";

import { useState } from "react";

interface AdminBroadcastTabProps {
  onBroadcast: (input: {
    kind: "system" | "order" | "price_drop";
    titleEn: string;
    titleAr: string;
    bodyEn: string;
    bodyAr: string;
    expiresAt?: string;
  }) => Promise<void>;
  lang: "en" | "ar";
}

export function AdminBroadcastTab({
  onBroadcast,
  lang,
}: AdminBroadcastTabProps) {
  const isAr = lang === "ar";

  const [kind, setKind] = useState<"system" | "order" | "price_drop">("system");
  const [titleEn, setTitleEn] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [bodyEn, setBodyEn] = useState("");
  const [bodyAr, setBodyAr] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const [sending, setSending] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!titleEn.trim() || !titleAr.trim() || !bodyEn.trim() || !bodyAr.trim()) return;

    try {
      setSending(true);
      setSuccessMsg("");
      await onBroadcast({
        kind,
        titleEn: titleEn.trim(),
        titleAr: titleAr.trim(),
        bodyEn: bodyEn.trim(),
        bodyAr: bodyAr.trim(),
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });

      setSuccessMsg(
        isAr
          ? "تم إرسال الإشعار العام بنجاح لجميع مستخدمي المنصة!"
          : "System broadcast notification sent successfully to all users!"
      );
      setTitleEn("");
      setTitleAr("");
      setBodyEn("");
      setBodyAr("");
      setExpiresAt("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-on-surface">
          {isAr ? "بث إشعارات عامة للنظام" : "Broadcast System Notifications"}
        </h2>
        <p className="text-sm text-on-surface-variant">
          {isAr
            ? "إرسال إعلانات عامة أو تنبيهات لجميع مستخدمي منصة موداي بدعم كامل للغتين"
            : "Send announcements or system updates to all active Mooday users"}
        </p>
      </div>

      {successMsg && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm font-semibold text-emerald-600">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-surface-container-high bg-surface p-6 space-y-5 shadow-sm"
      >
        <div>
          <label className="text-xs font-bold uppercase text-on-surface-variant tracking-wider block mb-1.5">
            {isAr ? "نوع الإشعار" : "Notification Kind"}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: "system", labelEn: "System", labelAr: "تحديث نظام", icon: "dns" },
              { id: "order", labelEn: "Order Alert", labelAr: "تنبيه طلبات", icon: "local_shipping" },
              { id: "price_drop", labelEn: "Promotional", labelAr: "عروض وتخفيضات", icon: "sell" },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setKind(item.id as "system" | "order" | "price_drop")}
                className={`flex items-center justify-center gap-2 rounded-xl py-3 px-2 text-xs font-bold border transition ${
                  kind === item.id
                    ? "bg-primary text-on-primary border-primary shadow-sm"
                    : "bg-surface border-surface-container-high text-on-surface-variant hover:bg-surface-container-low"
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                <span>{isAr ? item.labelAr : item.labelEn}</span>
              </button>
            ))}
          </div>
        </div>

        {/* English Inputs */}
        <div className="space-y-3 pt-2 border-t border-surface-container-low">
          <h3 className="text-xs font-bold uppercase text-primary tracking-wider">
            English Version (LTR)
          </h3>
          <div>
            <label className="text-xs font-semibold text-on-surface">Title (EN)</label>
            <input
              type="text"
              required
              value={titleEn}
              onChange={(e) => setTitleEn(e.target.value)}
              placeholder="e.g. Scheduled System Maintenance on July 25th"
              className="mt-1 w-full rounded-xl border border-surface-container-high bg-surface-container-low p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface">Body (EN)</label>
            <textarea
              rows={3}
              required
              value={bodyEn}
              onChange={(e) => setBodyEn(e.target.value)}
              placeholder="e.g. Mooday marketplace services will undergo brief optimization between 2:00 AM and 4:00 AM GST."
              className="mt-1 w-full rounded-xl border border-surface-container-high bg-surface-container-low p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Arabic Inputs */}
        <div className="space-y-3 pt-2 border-t border-surface-container-low">
          <h3 className="text-xs font-bold uppercase text-primary tracking-wider">
            النسخة العربية (RTL)
          </h3>
          <div>
            <label className="text-xs font-semibold text-on-surface">العنوان (عربي)</label>
            <input
              type="text"
              required
              value={titleAr}
              onChange={(e) => setTitleAr(e.target.value)}
              placeholder="مثال: صيانة دورية مجدولة للمنصة يوم ۲۵ يوليو"
              className="mt-1 w-full rounded-xl border border-surface-container-high bg-surface-container-low p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-right"
              dir="rtl"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-on-surface">نص الإشعار (عربي)</label>
            <textarea
              rows={3}
              required
              value={bodyAr}
              onChange={(e) => setBodyAr(e.target.value)}
              placeholder="مثال: ستخضع خدمات منصة موداي لتحديثات تحسينية من الساعة ۲:۰۰ صباحاً وحتى ۴:۰۰ صباحاً."
              className="mt-1 w-full rounded-xl border border-surface-container-high bg-surface-container-low p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary text-right"
              dir="rtl"
            />
          </div>
        </div>

        {/* Expiry Date */}
        <div className="pt-2 border-t border-surface-container-low">
          <label className="text-xs font-semibold text-on-surface">
            {isAr ? "تاريخ انتهاء الإشعار (اختياري)" : "Expiration Date (Optional)"}
          </label>
          <input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => setExpiresAt(e.target.value)}
            className="mt-1 w-full rounded-xl border border-surface-container-high bg-surface-container-low p-3 text-sm"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={sending}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-on-primary hover:bg-primary/90 transition shadow-sm disabled:opacity-50"
        >
          <span className="material-symbols-outlined text-[20px]">campaign</span>
          <span>{isAr ? "إرسال الإشعار لجميع کاربران" : "Broadcast Notification"}</span>
        </button>
      </form>
    </div>
  );
}
