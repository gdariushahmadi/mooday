"use client";

import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AppContext, type Product } from "@/context/AppContext";
import { defaultProducts } from "@/data/products";
import {
  mockAffiliateService,
  recordMockAffiliateClick,
} from "@/services/affiliate/mockAffiliateService";
import type {
  AffiliateClickService,
  AffiliateLinkRecord,
  AffiliateLinkService,
  AffiliateReportSummary,
  PartnerRecord,
} from "@/services/backend/contracts";
import type { AffiliateSubTab } from "../AdminTypes";

interface AffiliateTabProps {
  mode?: "demo" | "live";
  lang?: "en" | "ar";
}

interface AffiliateGateway {
  affiliateLinks: AffiliateLinkService;
  affiliateClicks: AffiliateClickService;
}

interface PartnerForm {
  code: string;
  name: string;
  logoUrl: string;
  baseUrlTemplate: string;
  displayOrder: string;
  isActive: boolean;
}

interface LinkForm {
  listingId: string;
  partnerCode: string;
  affiliateUrl: string;
  displayOrder: string;
}

const COPY = {
  en: {
    title: "Affiliate links",
    intro: "Show new alternatives on a listing and measure outbound interest.",
    demo: "Demo data",
    live: "Live data",
    demoNote:
      "The seeded links appear on selected product pages. Open a partner row to test the redirect. Changes are safe to make in this demo.",
    partners: "Partners",
    links: "Listing links",
    reports: "Reports",
    loading: "Loading...",
    retry: "Retry",
    save: "Save changes",
    addPartner: "Add partner",
    editPartner: "Edit partner",
    cancel: "Cancel",
    code: "Code",
    name: "Name",
    logoUrl: "Logo URL",
    baseUrl: "Base URL",
    order: "Order",
    status: "Status",
    active: "Active",
    inactive: "Inactive",
    activate: "Activate",
    deactivate: "Deactivate",
    edit: "Edit",
    delete: "Delete",
    noPartners: "No partners yet.",
    partnerHint: "Use a short code such as amazon-ae.",
    listing: "Listing",
    chooseListing: "Choose a listing",
    partner: "Partner",
    choosePartner: "Choose an active partner",
    affiliateUrl: "Affiliate destination URL",
    affiliateUrlHint: "Use the full HTTPS URL supplied by the partner.",
    addLink: "Add link",
    editLink: "Edit link",
    shortPath: "Public path",
    openPreview: "Open preview",
    noLinks: "No links for this listing.",
    selectListing: "Select a listing to load its links.",
    totalClicks: "Total clicks",
    last30: "Last 30 days",
    byPartner: "Clicks by partner",
    byListing: "Top listings",
    noClicks: "No clicks in this period.",
    refresh: "Refresh",
    required: "Complete the required fields.",
    invalidUrl: "Enter a valid HTTPS URL.",
    unavailable: "Affiliate services are not available in this session.",
    confirmDelete: "Delete this item?",
    blockedDelete:
      "A partner with links cannot be deleted. Deactivate it or remove its links first.",
    listingFallback: "Listing",
  },
  ar: {
    title: "روابط التسويق بالعمولة",
    intro: "اعرض البدائل الجديدة للقطعة وقِس الاهتمام بالمتاجر الخارجية.",
    demo: "بيانات تجريبية",
    live: "بيانات مباشرة",
    demoNote:
      "تظهر الروابط النموذجية في صفحات المنتجات المحددة. افتح صف الشريك لتجربة التحويل. التغييرات آمنة في هذه النسخة.",
    partners: "الشركاء",
    links: "روابط الإعلانات",
    reports: "التقارير",
    loading: "جاري التحميل...",
    retry: "إعادة المحاولة",
    save: "حفظ التغييرات",
    addPartner: "إضافة شريك",
    editPartner: "تعديل الشريك",
    cancel: "إلغاء",
    code: "الرمز",
    name: "الاسم",
    logoUrl: "رابط الشعار",
    baseUrl: "الرابط الأساسي",
    order: "الترتيب",
    status: "الحالة",
    active: "نشط",
    inactive: "غير نشط",
    activate: "تفعيل",
    deactivate: "إيقاف",
    edit: "تعديل",
    delete: "حذف",
    noPartners: "لا يوجد شركاء بعد.",
    partnerHint: "استخدم رمزاً مختصراً مثل amazon-ae.",
    listing: "الإعلان",
    chooseListing: "اختر إعلاناً",
    partner: "الشريك",
    choosePartner: "اختر شريكاً نشطاً",
    affiliateUrl: "رابط الوجهة",
    affiliateUrlHint: "استخدم رابط HTTPS الكامل الذي يقدمه الشريك.",
    addLink: "إضافة الرابط",
    editLink: "تعديل الرابط",
    shortPath: "المسار العام",
    openPreview: "فتح المعاينة",
    noLinks: "لا توجد روابط لهذا الإعلان.",
    selectListing: "اختر إعلاناً لتحميل روابطه.",
    totalClicks: "إجمالي النقرات",
    last30: "آخر ٣٠ يوماً",
    byPartner: "النقرات حسب الشريك",
    byListing: "الإعلانات الأعلى",
    noClicks: "لا توجد نقرات في هذه الفترة.",
    refresh: "تحديث",
    required: "أكمل الحقول المطلوبة.",
    invalidUrl: "أدخل رابط HTTPS صحيحاً.",
    unavailable: "خدمات التسويق بالعمولة في هذه الجلسة غير متاحة.",
    confirmDelete: "هل تريد حذف هذا العنصر؟",
    blockedDelete:
      "لا يمكن حذف شريك لديه روابط. أوقفه أو احذف روابطه أولاً.",
    listingFallback: "إعلان",
  },
} as const;

const inputClass =
  "mt-1 w-full rounded-lg border border-surface-container-high bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function statusClass(isActive: boolean): string {
  return isActive
    ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
    : "bg-surface-container-high text-on-surface-variant";
}

export function AffiliateTab({ mode = "demo", lang }: AffiliateTabProps) {
  const app = useContext(AppContext);
  const phase2Backend = app?.phase2Backend ?? null;
  const isAr = (lang ?? app?.language ?? "en") === "ar";
  const t = isAr ? COPY.ar : COPY.en;
  const listings = useMemo(() => {
    const source = app?.listings?.length ? app.listings : defaultProducts;
    const byId = new Map<string, Product>();
    for (const listing of source) byId.set(listing.id, listing);
    return Array.from(byId.values());
  }, [app?.listings]);
  const gateway = useMemo<AffiliateGateway>(
    () =>
      mode === "live" && phase2Backend
        ? {
            affiliateLinks: phase2Backend.affiliateLinks,
            affiliateClicks: phase2Backend.affiliateClicks,
          }
        : {
            affiliateLinks: mockAffiliateService,
            affiliateClicks: mockAffiliateService,
          },
    [mode, phase2Backend],
  );
  const [subTab, setSubTab] = useState<AffiliateSubTab>("partners");

  if (mode === "live" && !phase2Backend) {
    return (
      <div className="rounded-2xl border border-error/20 bg-error/10 p-6 text-sm text-error">
        {t.unavailable}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="text-xl font-bold tracking-tight text-on-surface">
            {t.title}
          </h2>
          <span
            className={
              "rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider " +
              (mode === "demo"
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300")
            }
          >
            {mode === "demo" ? t.demo : t.live}
          </span>
        </div>
        <p className="text-sm text-on-surface-variant">{t.intro}</p>
      </div>

      {mode === "demo" && (
        <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <span
            className="material-symbols-outlined shrink-0 text-[20px] text-primary"
            aria-hidden="true"
          >
            info
          </span>
          <p className="text-xs leading-5 text-on-surface-variant">{t.demoNote}</p>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto border-b border-surface-container-high pb-2">
        {(
          [
            ["partners", t.partners],
            ["links", t.links],
            ["reports", t.reports],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setSubTab(key)}
            className={
              "shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition " +
              (subTab === key
                ? "bg-primary text-on-primary"
                : "text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface")
            }
            data-testid={"affiliate-subtab-" + key}
          >
            {label}
          </button>
        ))}
      </div>

      {subTab === "partners" && (
        <PartnersView gateway={gateway} lang={isAr ? "ar" : "en"} />
      )}
      {subTab === "links" && (
        <LinksView
          gateway={gateway}
          listings={listings}
          lang={isAr ? "ar" : "en"}
          mode={mode}
        />
      )}
      {subTab === "reports" && (
        <ReportsView
          gateway={gateway}
          listings={listings}
          lang={isAr ? "ar" : "en"}
        />
      )}
    </div>
  );
}

function PartnersView({
  gateway,
  lang,
}: {
  gateway: AffiliateGateway;
  lang: "en" | "ar";
}) {
  const t = lang === "ar" ? COPY.ar : COPY.en;
  const [partners, setPartners] = useState<PartnerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<PartnerForm>({
    code: "",
    name: "",
    logoUrl: "",
    baseUrlTemplate: "",
    displayOrder: "1",
    isActive: true,
  });

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setPartners(await gateway.affiliateLinks.listPartners(true));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : t.retry);
    } finally {
      setLoading(false);
    }
  }, [gateway, t.retry]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const resetForm = () => {
    setForm({
      code: "",
      name: "",
      logoUrl: "",
      baseUrlTemplate: "",
      displayOrder: String(partners.length + 1),
      isActive: true,
    });
    setEditingCode(null);
    setFormOpen(false);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!form.name.trim() || (!editingCode && !form.code.trim())) {
      setError(t.required);
      return;
    }
    setError("");
    setNotice("");
    try {
      if (editingCode) {
        await gateway.affiliateLinks.updatePartner(editingCode, {
          name: form.name.trim(),
          logoUrl: form.logoUrl.trim() || null,
          baseUrlTemplate: form.baseUrlTemplate.trim() || null,
          displayOrder: Number(form.displayOrder) || 0,
          isActive: form.isActive,
        });
        setNotice(t.save);
      } else {
        await gateway.affiliateLinks.createPartner({
          code: form.code.trim(),
          name: form.name.trim(),
          logoUrl: form.logoUrl.trim() || undefined,
          baseUrlTemplate: form.baseUrlTemplate.trim() || undefined,
          displayOrder: Number(form.displayOrder) || 0,
          isActive: form.isActive,
        });
        setNotice(t.addPartner);
      }
      resetForm();
      await load();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : t.retry);
    }
  };

  const startEdit = (partner: PartnerRecord) => {
    setEditingCode(partner.code);
    setForm({
      code: partner.code,
      name: partner.name,
      logoUrl: partner.logoUrl ?? "",
      baseUrlTemplate: partner.baseUrlTemplate ?? "",
      displayOrder: String(partner.displayOrder),
      isActive: partner.isActive,
    });
    setFormOpen(true);
    setError("");
    setNotice("");
  };

  const toggle = async (partner: PartnerRecord) => {
    setError("");
    try {
      await gateway.affiliateLinks.updatePartner(partner.code, {
        isActive: !partner.isActive,
      });
      await load();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : t.retry);
    }
  };

  const remove = async (partner: PartnerRecord) => {
    if (!window.confirm(t.confirmDelete)) return;
    setError("");
    try {
      await gateway.affiliateLinks.deletePartner(partner.code);
      await load();
    } catch (reason: unknown) {
      setError(
        reason instanceof Error ? reason.message : t.blockedDelete,
      );
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-on-surface">{t.partners}</h3>
          <p className="text-xs text-on-surface-variant">{t.partnerHint}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (formOpen) resetForm();
            else setFormOpen(true);
          }}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary hover:bg-primary/90"
        >
          {formOpen ? t.cancel : t.addPartner}
        </button>
      </div>

      {formOpen && (
        <form
          onSubmit={submit}
          className="grid gap-3 rounded-xl border border-surface-container-high bg-surface p-4 sm:grid-cols-2"
        >
          <h4 className="sm:col-span-2 font-bold text-on-surface">
            {editingCode ? t.editPartner : t.addPartner}
          </h4>
          <label className="text-xs font-bold text-on-surface">
            {t.code}
            <input
              value={form.code}
              disabled={Boolean(editingCode)}
              onChange={(event) =>
                setForm((current) => ({ ...current, code: event.target.value }))
              }
              className={inputClass}
              placeholder="amazon-ae"
            />
          </label>
          <label className="text-xs font-bold text-on-surface">
            {t.name}
            <input
              required
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({ ...current, name: event.target.value }))
              }
              className={inputClass}
              placeholder="Amazon UAE"
            />
          </label>
          <label className="text-xs font-bold text-on-surface">
            {t.logoUrl}
            <input
              type="url"
              value={form.logoUrl}
              onChange={(event) =>
                setForm((current) => ({ ...current, logoUrl: event.target.value }))
              }
              className={inputClass}
              placeholder="https://..."
            />
          </label>
          <label className="text-xs font-bold text-on-surface">
            {t.baseUrl}
            <input
              type="url"
              value={form.baseUrlTemplate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  baseUrlTemplate: event.target.value,
                }))
              }
              className={inputClass}
              placeholder="https://www.amazon.ae/"
            />
          </label>
          <label className="text-xs font-bold text-on-surface">
            {t.order}
            <input
              type="number"
              min="0"
              value={form.displayOrder}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  displayOrder: event.target.value,
                }))
              }
              className={inputClass}
            />
          </label>
          <label className="flex items-center gap-2 self-end text-xs font-bold text-on-surface">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  isActive: event.target.checked,
                }))
              }
              className="h-4 w-4 accent-primary"
            />
            {t.active}
          </label>
          <div className="flex gap-2 sm:col-span-2">
            <button
              type="submit"
              className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-on-primary hover:bg-primary/90"
              data-testid="affiliate-partner-create"
            >
              {editingCode ? t.save : t.addPartner}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-surface-container-high px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-container-low"
            >
              {t.cancel}
            </button>
          </div>
        </form>
      )}

      {error && (
        <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
          {notice}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-surface-container-high bg-surface">
        {loading ? (
          <p className="p-5 text-sm text-on-surface-variant">{t.loading}</p>
        ) : partners.length === 0 ? (
          <p className="p-5 text-sm text-on-surface-variant">{t.noPartners}</p>
        ) : (
          <div className="divide-y divide-surface-container-high">
            {partners.map((partner) => (
              <div
                key={partner.code}
                className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <span className="material-symbols-outlined" aria-hidden="true">
                      storefront
                    </span>
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold text-on-surface">{partner.name}</p>
                    <p className="truncate font-mono text-xs text-on-surface-variant">
                      {partner.code}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={"rounded-full px-2 py-1 text-[10px] font-bold " + statusClass(partner.isActive)}>
                    {partner.isActive ? t.active : t.inactive}
                  </span>
                  <button
                    type="button"
                    onClick={() => void toggle(partner)}
                    className="rounded-lg border border-surface-container-high px-3 py-1.5 text-xs font-bold text-on-surface hover:bg-surface-container-low"
                  >
                    {partner.isActive ? t.deactivate : t.activate}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(partner)}
                    className="rounded-lg border border-surface-container-high px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/5"
                  >
                    {t.edit}
                  </button>
                  <button
                    type="button"
                    onClick={() => void remove(partner)}
                    className="rounded-lg border border-error/30 px-3 py-1.5 text-xs font-bold text-error hover:bg-error/10"
                  >
                    {t.delete}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function LinksView({
  gateway,
  listings,
  lang,
  mode,
}: {
  gateway: AffiliateGateway;
  listings: Product[];
  lang: "en" | "ar";
  mode: "demo" | "live";
}) {
  const t = lang === "ar" ? COPY.ar : COPY.en;
  const [selectedListingId, setSelectedListingId] = useState("handbag-tan");
  const [partners, setPartners] = useState<PartnerRecord[]>([]);
  const [links, setLinks] = useState<AffiliateLinkRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState<LinkForm>({
    listingId: "handbag-tan",
    partnerCode: "",
    affiliateUrl: "",
    displayOrder: "1",
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editUrl, setEditUrl] = useState("");
  const [editOrder, setEditOrder] = useState("1");

  const listingById = useMemo(
    () => new Map(listings.map((listing) => [listing.id, listing])),
    [listings],
  );
  const listingLabel = (id: string) => {
    const listing = listingById.get(id);
    return listing
      ? lang === "ar"
        ? listing.titleAr
        : listing.titleEn
      : t.listingFallback + " " + id;
  };

  const loadPartners = useCallback(async () => {
    try {
      const next = await gateway.affiliateLinks.listPartners(true);
      setPartners(next);
      setForm((current) => ({
        ...current,
        partnerCode:
          current.partnerCode ||
          next.find((partner) => partner.isActive)?.code ||
          "",
      }));
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : t.retry);
    }
  }, [gateway, t.retry]);

  const loadLinks = useCallback(async () => {
    if (!selectedListingId) {
      setLinks([]);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setLinks(
        await gateway.affiliateLinks.listLinksForListing(
          selectedListingId,
          true,
        ),
      );
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : t.retry);
    } finally {
      setLoading(false);
    }
  }, [gateway, selectedListingId, t.retry]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadPartners();
    });
  }, [loadPartners]);

  useEffect(() => {
    queueMicrotask(() => {
      void loadLinks();
    });
  }, [loadLinks]);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (
      !form.listingId ||
      !form.partnerCode ||
      !form.affiliateUrl.trim()
    ) {
      setError(t.required);
      return;
    }
    if (!isHttpsUrl(form.affiliateUrl.trim())) {
      setError(t.invalidUrl);
      return;
    }
    setError("");
    setNotice("");
    try {
      await gateway.affiliateLinks.createLink({
        listingId: form.listingId,
        partnerCode: form.partnerCode,
        affiliateUrl: form.affiliateUrl.trim(),
        displayOrder: Number(form.displayOrder) || 1,
      });
      setForm((current) => ({ ...current, affiliateUrl: "" }));
      setNotice(t.addLink);
      await loadLinks();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : t.retry);
    }
  };

  const toggle = async (link: AffiliateLinkRecord) => {
    setError("");
    try {
      await gateway.affiliateLinks.updateLink(link.id, {
        isActive: !link.isActive,
      });
      await loadLinks();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : t.retry);
    }
  };

  const startEdit = (link: AffiliateLinkRecord) => {
    setEditingId(link.id);
    setEditUrl(link.affiliateUrl);
    setEditOrder(String(link.displayOrder));
    setError("");
  };

  const saveEdit = async (link: AffiliateLinkRecord) => {
    if (!isHttpsUrl(editUrl.trim())) {
      setError(t.invalidUrl);
      return;
    }
    try {
      await gateway.affiliateLinks.updateLink(link.id, {
        affiliateUrl: editUrl.trim(),
        displayOrder: Number(editOrder) || 1,
      });
      setEditingId(null);
      setNotice(t.save);
      await loadLinks();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : t.retry);
    }
  };

  const remove = async (link: AffiliateLinkRecord) => {
    if (!window.confirm(t.confirmDelete)) return;
    try {
      await gateway.affiliateLinks.removeLink(link.id);
      await loadLinks();
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : t.retry);
    }
  };

  return (
    <section className="space-y-4">
      <div>
        <h3 className="font-bold text-on-surface">{t.links}</h3>
        <p className="text-xs text-on-surface-variant">{t.affiliateUrlHint}</p>
      </div>

      <form
        onSubmit={submit}
        className="grid gap-3 rounded-xl border border-surface-container-high bg-surface p-4 sm:grid-cols-2"
      >
        <label className="text-xs font-bold text-on-surface">
          {t.listing}
          <select
            value={form.listingId}
            onChange={(event) => {
              setForm((current) => ({
                ...current,
                listingId: event.target.value,
              }));
              setSelectedListingId(event.target.value);
            }}
            className={inputClass}
          >
            <option value="">{t.chooseListing}</option>
            {listings.map((listing) => (
              <option key={listing.id} value={listing.id}>
                {listingLabel(listing.id)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-bold text-on-surface">
          {t.partner}
          <select
            value={form.partnerCode}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                partnerCode: event.target.value,
              }))
            }
            className={inputClass}
          >
            <option value="">{t.choosePartner}</option>
            {partners
              .filter((partner) => partner.isActive)
              .map((partner) => (
                <option key={partner.code} value={partner.code}>
                  {partner.name}
                </option>
              ))}
          </select>
        </label>
        <label className="text-xs font-bold text-on-surface sm:col-span-2">
          {t.affiliateUrl}
          <input
            type="url"
            required
            value={form.affiliateUrl}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                affiliateUrl: event.target.value,
              }))
            }
            className={inputClass}
            placeholder="https://www.amazon.ae/...?tag=daneg-21"
          />
        </label>
        <label className="text-xs font-bold text-on-surface">
          {t.order}
          <input
            type="number"
            min="0"
            value={form.displayOrder}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                displayOrder: event.target.value,
              }))
            }
            className={inputClass}
          />
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-on-primary hover:bg-primary/90"
            data-testid="affiliate-link-create"
          >
            {t.addLink}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
          {error}
        </p>
      )}
      {notice && (
        <p role="status" className="rounded-lg bg-emerald-500/10 px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300">
          {notice}
        </p>
      )}

      <div className="overflow-hidden rounded-xl border border-surface-container-high bg-surface">
        <div className="border-b border-surface-container-high bg-surface-container-low px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-wider text-primary">
            {selectedListingId ? listingLabel(selectedListingId) : t.selectListing}
          </p>
        </div>
        {loading ? (
          <p className="p-5 text-sm text-on-surface-variant">{t.loading}</p>
        ) : !selectedListingId ? (
          <p className="p-5 text-sm text-on-surface-variant">{t.selectListing}</p>
        ) : links.length === 0 ? (
          <p className="p-5 text-sm text-on-surface-variant">{t.noLinks}</p>
        ) : (
          <div className="divide-y divide-surface-container-high">
            {links.map((link) => {
              const partner = partners.find(
                (candidate) => candidate.code === link.partnerCode,
              );
              const isEditing = editingId === link.id;
              return (
                <div key={link.id} className="space-y-3 p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-on-surface">
                          {partner?.name ?? link.partnerCode}
                        </span>
                        <span className={"rounded-full px-2 py-1 text-[10px] font-bold " + statusClass(link.isActive)}>
                          {link.isActive ? t.active : t.inactive}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-xs text-on-surface-variant">
                        {t.shortPath}: /go/{link.shortId}
                      </p>
                      {!isEditing && (
                        <p className="mt-1 max-w-2xl truncate text-xs text-on-surface-variant">
                          {link.affiliateUrl}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <a
                        href={"/go/" + link.shortId}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => {
                          if (mode === "demo") {
                            recordMockAffiliateClick(link.shortId);
                          }
                        }}
                        className="rounded-lg border border-primary/30 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/5"
                      >
                        {t.openPreview}
                      </a>
                      <button
                        type="button"
                        onClick={() => void toggle(link)}
                        className="rounded-lg border border-surface-container-high px-3 py-1.5 text-xs font-bold text-on-surface hover:bg-surface-container-low"
                      >
                        {link.isActive ? t.deactivate : t.activate}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(link)}
                        className="rounded-lg border border-surface-container-high px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/5"
                      >
                        {t.edit}
                      </button>
                      <button
                        type="button"
                        onClick={() => void remove(link)}
                        className="rounded-lg border border-error/30 px-3 py-1.5 text-xs font-bold text-error hover:bg-error/10"
                      >
                        {t.delete}
                      </button>
                    </div>
                  </div>
                  {isEditing && (
                    <div className="grid gap-3 rounded-lg bg-surface-container-low p-3 sm:grid-cols-[1fr_120px_auto_auto] sm:items-end">
                      <label className="text-xs font-bold text-on-surface">
                        {t.affiliateUrl}
                        <input
                          value={editUrl}
                          onChange={(event) => setEditUrl(event.target.value)}
                          className={inputClass}
                        />
                      </label>
                      <label className="text-xs font-bold text-on-surface">
                        {t.order}
                        <input
                          type="number"
                          min="0"
                          value={editOrder}
                          onChange={(event) => setEditOrder(event.target.value)}
                          className={inputClass}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => void saveEdit(link)}
                        className="rounded-lg bg-primary px-3 py-2 text-xs font-bold text-on-primary"
                      >
                        {t.save}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-surface-container-high px-3 py-2 text-xs font-bold text-on-surface"
                      >
                        {t.cancel}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function ReportsView({
  gateway,
  listings,
  lang,
}: {
  gateway: AffiliateGateway;
  listings: Product[];
  lang: "en" | "ar";
}) {
  const t = lang === "ar" ? COPY.ar : COPY.en;
  const [report, setReport] = useState<AffiliateReportSummary | null>(null);
  const [partners, setPartners] = useState<PartnerRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const listingById = useMemo(
    () => new Map(listings.map((listing) => [listing.id, listing])),
    [listings],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const to = new Date();
      const from = new Date(to.getTime() - 30 * 24 * 60 * 60 * 1000);
      const [nextReport, nextPartners] = await Promise.all([
        gateway.affiliateClicks.aggregateForReports({
          fromIso: from.toISOString(),
          toIso: to.toISOString(),
        }),
        gateway.affiliateLinks.listPartners(true),
      ]);
      setReport(nextReport);
      setPartners(nextPartners);
    } catch (reason: unknown) {
      setError(reason instanceof Error ? reason.message : t.retry);
    } finally {
      setLoading(false);
    }
  }, [gateway, t.retry]);

  useEffect(() => {
    queueMicrotask(() => {
      void load();
    });
  }, [load]);

  const partnerName = (code: string) =>
    partners.find((partner) => partner.code === code)?.name ?? code;
  const listingName = (id: string) => {
    const listing = listingById.get(id);
    return listing ? (lang === "ar" ? listing.titleAr : listing.titleEn) : id;
  };

  if (loading) {
    return <p className="text-sm text-on-surface-variant">{t.loading}</p>;
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-bold text-on-surface">{t.reports}</h3>
          <p className="text-xs text-on-surface-variant">{t.last30}</p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-xl border border-surface-container-high px-4 py-2 text-sm font-bold text-on-surface hover:bg-surface-container-low"
        >
          {t.refresh}
        </button>
      </div>
      {error && (
        <p role="alert" className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
          {error}
        </p>
      )}
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">
          {t.totalClicks}
        </p>
        <p className="mt-2 text-3xl font-extrabold tabular-nums text-on-surface">
          {report?.totalClicks ?? 0}
        </p>
        <p className="mt-1 text-xs text-on-surface-variant">{t.last30}</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-surface-container-high bg-surface p-4">
          <h4 className="font-bold text-on-surface">{t.byPartner}</h4>
          <div className="mt-3 divide-y divide-surface-container-high">
            {!report || report.byPartner.length === 0 ? (
              <p className="py-3 text-sm text-on-surface-variant">{t.noClicks}</p>
            ) : (
              report.byPartner.map((item) => (
                <div
                  key={item.partnerCode}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="truncate text-on-surface">
                    {partnerName(item.partnerCode)}
                  </span>
                  <span className="font-bold tabular-nums text-primary">
                    {item.clicks}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
        <div className="rounded-xl border border-surface-container-high bg-surface p-4">
          <h4 className="font-bold text-on-surface">{t.byListing}</h4>
          <div className="mt-3 divide-y divide-surface-container-high">
            {!report || report.byListing.length === 0 ? (
              <p className="py-3 text-sm text-on-surface-variant">{t.noClicks}</p>
            ) : (
              report.byListing.map((item) => (
                <div
                  key={item.listingId}
                  className="flex items-center justify-between gap-3 py-3 text-sm"
                >
                  <span className="truncate text-on-surface">
                    {listingName(item.listingId)}
                  </span>
                  <span className="font-bold tabular-nums text-primary">
                    {item.clicks}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
