"use client";

import type { AdminOrderSummary } from "@/services/admin/actions";
import { formatAEDLabel } from "@/lib/format";

interface AdminOrdersTabProps {
  orders: AdminOrderSummary[];
  lang: "en" | "ar";
}

export function AdminOrdersTab({ orders, lang }: AdminOrdersTabProps) {
  const isAr = lang === "ar";

  return (
    <section className="space-y-4">
      <div>
        <h2 className="font-serif text-xl text-on-surface">
          {isAr ? "الطلبات" : "Orders"}
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          {isAr
            ? `${orders.length} طلب في لوحة التحكم`
            : `${orders.length} order${orders.length === 1 ? "" : "s"} in the admin queue`}
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-8 text-center text-on-surface-variant">
          {isAr ? "لا توجد طلبات حالياً." : "No orders yet."}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <li
              key={order.id}
              className="rounded-xl border border-surface-container-high bg-surface-container-lowest p-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-on-surface">{order.id}</span>
                  <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full bg-surface-container-high text-on-surface-variant">
                    {order.status}
                  </span>
                </div>
                <p className="text-sm text-on-surface-variant mt-1 truncate">
                  {order.itemTitlesEn.join(", ") || "—"}
                </p>
                <p className="text-xs text-outline mt-1">
                  {isAr ? "المشتري" : "Buyer"}: {order.buyerEmail} ·{" "}
                  {isAr ? "البائع" : "Seller"}: {order.sellerEmail}
                </p>
              </div>
              <div className="text-end flex-shrink-0">
                <div className="font-bold text-primary">
                  {formatAEDLabel(order.totalMinor / 100)}
                </div>
                <div className="text-[11px] text-outline">
                  {new Date(order.createdAt).toLocaleDateString(
                    isAr ? "ar-AE" : "en-AE",
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
