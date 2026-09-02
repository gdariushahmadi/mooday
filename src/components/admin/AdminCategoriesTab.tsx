"use client";

import { useState } from "react";
import type { AdminCategorySummary } from "@/services/admin/actions";

interface AdminCategoriesTabProps {
  categories: AdminCategorySummary[];
  onCreate: (input: {
    slug: string;
    nameEn: string;
    nameAr: string;
    sortOrder: number;
  }) => Promise<void>;
  onUpdate: (
    categoryId: string,
    input: {
      nameEn: string;
      nameAr: string;
      sortOrder: number;
      isActive: boolean;
    },
  ) => Promise<void>;
  onDelete: (categoryId: string) => Promise<void>;
  lang: "en" | "ar";
}

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function AdminCategoriesTab({
  categories,
  onCreate,
  onUpdate,
  onDelete,
  lang,
}: AdminCategoriesTabProps) {
  const isAr = lang === "ar";

  const [creating, setCreating] = useState(false);
  const [newNameEn, setNewNameEn] = useState("");
  const [newNameAr, setNewNameAr] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const [editingCategory, setEditingCategory] =
    useState<AdminCategorySummary | null>(null);
  const [editNameEn, setEditNameEn] = useState("");
  const [editNameAr, setEditNameAr] = useState("");
  const [editSortOrder, setEditSortOrder] = useState(0);

  const [deletingCategory, setDeletingCategory] =
    useState<AdminCategorySummary | null>(null);

  const [processingId, setProcessingId] = useState<string | null>(null);

  const resetCreateForm = () => {
    setNewNameEn("");
    setNewNameAr("");
    setNewSlug("");
    setSlugTouched(false);
  };

  const submitCreate = async () => {
    if (!newNameEn.trim() || !newNameAr.trim() || !newSlug.trim()) return;
    try {
      setProcessingId("create");
      await onCreate({
        slug: newSlug.trim(),
        nameEn: newNameEn.trim(),
        nameAr: newNameAr.trim(),
        sortOrder: categories.length + 1,
      });
      resetCreateForm();
      setCreating(false);
    } finally {
      setProcessingId(null);
    }
  };

  const openEdit = (category: AdminCategorySummary) => {
    setEditingCategory(category);
    setEditNameEn(category.nameEn);
    setEditNameAr(category.nameAr);
    setEditSortOrder(category.sortOrder);
  };

  const submitEdit = async () => {
    if (!editingCategory || !editNameEn.trim() || !editNameAr.trim()) return;
    try {
      setProcessingId(editingCategory.id);
      await onUpdate(editingCategory.id, {
        nameEn: editNameEn.trim(),
        nameAr: editNameAr.trim(),
        sortOrder: editSortOrder,
        isActive: editingCategory.isActive,
      });
      setEditingCategory(null);
    } finally {
      setProcessingId(null);
    }
  };

  const toggleActive = async (category: AdminCategorySummary) => {
    try {
      setProcessingId(category.id);
      await onUpdate(category.id, {
        nameEn: category.nameEn,
        nameAr: category.nameAr,
        sortOrder: category.sortOrder,
        isActive: !category.isActive,
      });
    } finally {
      setProcessingId(null);
    }
  };

  const submitDelete = async () => {
    if (!deletingCategory) return;
    try {
      setProcessingId(deletingCategory.id);
      await onDelete(deletingCategory.id);
      setDeletingCategory(null);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-on-surface">
            {isAr ? "إدارة الفئات" : "Category Management"}
          </h2>
          <p className="text-sm text-on-surface-variant">
            {isAr
              ? "الفئات النشطة تظهر لبائعي المنتجات ومتصفحي السوق"
              : "Active categories appear in the sell flow and category filters"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary hover:bg-primary/90 transition w-fit"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          {isAr ? "فئة جديدة" : "New Category"}
        </button>
      </div>

      {/* List */}
      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-surface-container-high py-16 text-center">
          <span className="material-symbols-outlined text-[48px] text-on-surface-variant/40 mb-2">
            category
          </span>
          <h3 className="font-semibold text-on-surface">
            {isAr ? "لا توجد فئات بعد" : "No categories yet"}
          </h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-surface-container-high bg-surface p-4"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-xs font-bold text-primary">
                  {category.sortOrder}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-on-surface">
                      {isAr ? category.nameAr : category.nameEn}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
                        category.isActive
                          ? "bg-primary/10 text-primary"
                          : "bg-surface-container-high text-on-surface-variant"
                      }`}
                    >
                      {category.isActive
                        ? isAr
                          ? "نشط"
                          : "Active"
                        : isAr
                          ? "معطل"
                          : "Inactive"}
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">
                    {category.slug} · {isAr ? category.nameEn : category.nameAr}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  disabled={processingId === category.id}
                  onClick={() => toggleActive(category)}
                  className="rounded-xl border border-surface-container-high bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container transition disabled:opacity-50"
                >
                  {category.isActive
                    ? isAr
                      ? "تعطيل"
                      : "Deactivate"
                    : isAr
                      ? "تفعيل"
                      : "Activate"}
                </button>
                <button
                  type="button"
                  disabled={processingId === category.id}
                  onClick={() => openEdit(category)}
                  className="flex items-center gap-1.5 rounded-xl border border-surface-container-high bg-surface-container-low px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container transition disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">edit</span>
                  {isAr ? "تعديل" : "Edit"}
                </button>
                <button
                  type="button"
                  disabled={processingId === category.id}
                  onClick={() => setDeletingCategory(category)}
                  className="flex items-center gap-1.5 rounded-xl bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-500/20 transition disabled:opacity-50"
                >
                  <span className="material-symbols-outlined text-[16px]">delete</span>
                  {isAr ? "حذف" : "Delete"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {creating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-surface-container-high space-y-4">
            <h3 className="text-lg font-bold text-on-surface">
              {isAr ? "فئة جديدة" : "New Category"}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-on-surface">
                  {isAr ? "الاسم (English)" : "Name (English)"}
                </label>
                <input
                  type="text"
                  value={newNameEn}
                  onChange={(e) => {
                    setNewNameEn(e.target.value);
                    if (!slugTouched) setNewSlug(slugify(e.target.value));
                  }}
                  placeholder="e.g. Sunglasses"
                  className="mt-1 w-full rounded-xl border border-surface-container-high bg-surface-container-low p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface">
                  {isAr ? "الاسم (عربي)" : "Name (Arabic)"}
                </label>
                <input
                  type="text"
                  value={newNameAr}
                  onChange={(e) => setNewNameAr(e.target.value)}
                  placeholder="مثال: نظارات شمسية"
                  className="mt-1 w-full rounded-xl border border-surface-container-high bg-surface-container-low p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface">
                  {isAr ? "المعرف (slug)" : "Slug"}
                </label>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setNewSlug(slugify(e.target.value));
                  }}
                  placeholder="sunglasses"
                  className="mt-1 w-full rounded-xl border border-surface-container-high bg-surface-container-low p-2.5 text-sm font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setCreating(false);
                  resetCreateForm();
                }}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={
                  !newNameEn.trim() || !newNameAr.trim() || !newSlug.trim()
                }
                onClick={submitCreate}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary hover:bg-primary/90 disabled:opacity-50"
              >
                {isAr ? "إنشاء" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-surface-container-high space-y-4">
            <h3 className="text-lg font-bold text-on-surface">
              {isAr ? "تعديل الفئة" : "Edit Category"}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-on-surface">
                  {isAr ? "الاسم (English)" : "Name (English)"}
                </label>
                <input
                  type="text"
                  value={editNameEn}
                  onChange={(e) => setEditNameEn(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-surface-container-high bg-surface-container-low p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface">
                  {isAr ? "الاسم (عربي)" : "Name (Arabic)"}
                </label>
                <input
                  type="text"
                  value={editNameAr}
                  onChange={(e) => setEditNameAr(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-surface-container-high bg-surface-container-low p-2.5 text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-on-surface">
                  {isAr ? "ترتيب الظهور" : "Sort Order"}
                </label>
                <input
                  type="number"
                  min={1}
                  value={editSortOrder}
                  onChange={(e) => setEditSortOrder(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-surface-container-high bg-surface-container-low p-2.5 text-sm"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                disabled={!editNameEn.trim() || !editNameAr.trim()}
                onClick={submitEdit}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-on-primary hover:bg-primary/90 disabled:opacity-50"
              >
                {isAr ? "حفظ" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deletingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-surface-container-high space-y-4">
            <h3 className="text-lg font-bold text-on-surface">
              {isAr ? "حذف الفئة" : "Delete Category"}
            </h3>
            <p className="text-sm text-on-surface-variant">
              {isAr
                ? `هل تريد بالتأكيد حذف "${deletingCategory.nameAr}"؟ المنتجات الحالية المرتبطة بهذه الفئة لن تتأثر، لكنها لن تظهر بعد الآن في قائمة الفئات.`
                : `Delete "${deletingCategory.nameEn}"? Existing listings keep their category text, but it will no longer appear in the picker.`}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCategory(null)}
                className="rounded-xl px-4 py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container-low"
              >
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={submitDelete}
                className="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white hover:bg-rose-700"
              >
                {isAr ? "تأكيد الحذف" : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
