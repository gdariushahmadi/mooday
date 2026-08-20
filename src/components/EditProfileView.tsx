"use client";

import React, { useRef, useState } from "react";
import { useApp } from "@/context/AppContext";
import {
  AVATAR_MAX_BYTES,
  LISTING_MEDIA_ALLOWED_MIME,
} from "@/services/backend";


interface EditProfileViewProps {
  onBack: () => void;
  /** Called after saving the new profile snapshot. */
  onSaved?: () => void;
}

interface ProfileCopy {
  title: string;
  back: string;
  save: string;
  saved: string;
  cancel: string;
  personalInfo: string;
  fullName: string;
  fullNamePh: string;
  handle: string;
  handlePh: string;
  bio: string;
  bioPh: string;
  location: string;
  locationPh: string;
  avatarHeading: string;
  avatarHelp: string;
  avatarUpload: string;
  avatarChange: string;
  avatarUploading: string;
  avatarTooLarge: (limitMb: number) => string;
  avatarUnsupported: string;
  avatarUploadFailed: string;
  styleTags: string;
  styleTagPh: string;
  styleTagHelp: string;
  required: string;
}

const COPY: Record<"en" | "ar", ProfileCopy> = {
  en: {
    title: "Edit profile",
    back: "Back",
    save: "Save profile",
    saved: "Profile saved.",
    cancel: "Cancel",
    personalInfo: "Personal info",
    fullName: "Display name",
    fullNamePh: "Your name as shown to buyers",
    handle: "Handle",
    handlePh: "@username",
    bio: "Bio",
    bioPh: "A short description about your closet and what you curate.",
    location: "City",
    locationPh: "e.g. Dubai, UAE",
  avatarHeading: "Profile photo",
    avatarHelp:
      "JPG, PNG, or WEBP, up to 2 MB. Buyers love seeing a face.",
  avatarUpload: "Upload photo",
  avatarChange: "Change photo",
  avatarUploading: "Uploading…",
  avatarTooLarge: (limitMb) =>
    `That photo is too large. Keep it under ${limitMb} MB.`,
  avatarUnsupported:
    "We couldn't read that file. Use JPG, PNG, or WEBP.",
  avatarUploadFailed: "We couldn't upload your photo. Please try again.",
  styleTags: "Style tags",
    styleTagPh: "Add a tag…",
    styleTagHelp:
      "Up to 5 tags help the Discover feed surface your listings to the right audience.",
    required: "Please add a display name and handle.",
  },
  ar: {
    title: "تعديل الملف الشخصي",
    back: "رجوع",
    save: "حفظ التغييرات",
    saved: "تم حفظ الملف الشخصي.",
    cancel: "إلغاء",
    personalInfo: "المعلومات الشخصية",
    fullName: "الاسم المعروض",
    fullNamePh: "اسمك كما يظهر للمشترين",
    handle: "المعرّف",
    handlePh: "@اسم_المستخدم",
    bio: "نبذة",
    bioPh: "وصف قصير عن خزانتك وما تختارينه.",
    location: "المدينة",
    locationPh: "مثال: دبي، الإمارات",
  avatarHeading: "صورة الملف الشخصي",
    avatarHelp:
      "JPG أو PNG أو WEBP، حتى 2 ميغابايت.",
  avatarUpload: "رفع صورة",
  avatarChange: "تغيير الصورة",
  avatarUploading: "جارٍ الرفع…",
  avatarTooLarge: (limitMb) =>
    `الصورة كبيرة جدًا. يجب ألّا تتجاوز ${limitMb} ميغابايت.`,
  avatarUnsupported: "تعذّر قراءة هذا الملف. استخدمي JPG أو PNG أو WEBP.",
  avatarUploadFailed: "تعذّر رفع الصورة. حاولي مجدداً.",
  styleTags: "كلمات أسلوبك",
    styleTagPh: "أضيفي كلمة…",
    styleTagHelp:
      "حتى 5 كلمات تساعد في اقتراح منتجاتك في صفحة الاكتشاف.",
    required: "يرجى إضافة الاسم والمعرّف.",
  },
};

const PRESET_AVATARS = [
  "/sellers/fatima-almansoori.jpg",
  "/sellers/sarah.jpg",
  "/sellers/layla.jpg",
];

const AVATAR_MAX_LONG_EDGE_PX = 1024;

function coerceAvatarMime(mime: string): string | null {
  if (mime === "image/jpg") return "image/jpeg";
  if ((LISTING_MEDIA_ALLOWED_MIME as readonly string[]).includes(mime)) {
    return mime;
  }
  return null;
}

async function loadFileAsImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("invalid image"));
      img.src = url;
    });
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 0);
  }
}

async function resizeAvatarToBlob(
  source: HTMLImageElement,
  maxLongEdge: number,
  mime: string,
): Promise<Blob> {
  const { naturalWidth, naturalHeight } = source;
  const longEdge = Math.max(naturalWidth, naturalHeight);
  const scale = longEdge > maxLongEdge ? maxLongEdge / longEdge : 1;
  const width = Math.max(1, Math.round(naturalWidth * scale));
  const height = Math.max(1, Math.round(naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");
  ctx.drawImage(source, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, mime, 0.9);
  });
  if (!blob) throw new Error("image resize failed");
  return blob;
}

/**
 * G-33 — Edit Profile.
 *
 * A small, focused form to edit the user's profile snapshot:
 * display name, handle, bio, city, avatar pick, and style tags (chips).
 *
 * The profile snapshot lives in `useApp().userProfile` (added below).
 * For Phase 1 the snapshot is in-memory; Phase 3 will swap to a real
 * PUT /me endpoint.
 */
export const EditProfileView: React.FC<EditProfileViewProps> = ({
  onBack,
  onSaved,
}) => {
  const { language, userProfile, updateUserProfile } = useApp();
  const phase2Backend = useApp().phase2Backend;
  const isAr = language === "ar";
  const t = isAr ? COPY.ar : COPY.en;

  const [fullName, setFullName] = useState(
    isAr ? userProfile.fullNameAr : userProfile.fullNameEn,
  );
  const [handle, setHandle] = useState(userProfile.handle);
  const [bio, setBio] = useState(
    isAr ? userProfile.bioAr : userProfile.bioEn,
  );
  const [city, setCity] = useState(
    isAr ? userProfile.locationAr : userProfile.locationEn,
  );
  const [avatar, setAvatar] = useState(userProfile.avatar);
  const [tags, setTags] = useState<string[]>(
    isAr ? userProfile.styleTagsAr : userProfile.styleTagsEn,
  );
  const [tagDraft, setTagDraft] = useState("");
  const [formError, setFormError] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState("");
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const triggerAvatarPicker = () => {
    setAvatarError("");
    avatarInputRef.current?.click();
  };

  const handleAvatarFile = async (file: File) => {
    setAvatarError("");
    const coerced = coerceAvatarMime(file.type);
    if (!coerced) {
      setAvatarError(t.avatarUnsupported);
      return;
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setAvatarError(t.avatarTooLarge(AVATAR_MAX_BYTES / (1024 * 1024)));
      return;
    }
    if (!phase2Backend) {
      setAvatarError(t.avatarUploadFailed);
      return;
    }
    setAvatarUploading(true);
    try {
      const image = await loadFileAsImage(file);
      const blob = await resizeAvatarToBlob(
        image,
        AVATAR_MAX_LONG_EDGE_PX,
        coerced,
      );
      const url = await phase2Backend.profiles.uploadAvatar({
        filename: file.name || "avatar",
        mimeType: coerced as
          | "image/jpeg"
          | "image/png"
          | "image/webp",
        sizeBytes: blob.size,
        body: blob,
      });
      setAvatar(url);
    } catch {
      setAvatarError(t.avatarUploadFailed);
    } finally {
      setAvatarUploading(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const addTag = () => {
    const t = tagDraft.trim();
    if (!t) return;
    if (tags.includes(t)) return;
    if (tags.length >= 5) return;
    setTags([...tags, t]);
    setTagDraft("");
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((x) => x !== tag));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !handle) {
      setFormError(t.required);
      return;
    }
    setFormError("");
    try {
      await Promise.resolve(
        updateUserProfile({
          avatar,
          handle,
          ...(isAr
            ? {
                fullNameAr: fullName,
                bioAr: bio,
                locationAr: city,
                styleTagsAr: tags,
              }
            : {
                fullNameEn: fullName,
                bioEn: bio,
                locationEn: city,
                styleTagsEn: tags,
              }),
        }),
      );
      onSaved?.();
      onBack();
    } catch {
      setFormError(
        isAr
          ? "تعذر حفظ الملف الشخصي. حاولي مجدداً."
          : "We couldn't save your profile. Please try again.",
      );
    }
  };

  return (
    <div
      dir={isAr ? "rtl" : "ltr"}
      className="w-full max-w-[800px] mx-auto flex flex-col gap-md pb-10"
    >
      {/* Header */}
      <div className="app-page-header flex items-center justify-between border-b border-outline-variant pb-4">
        <button
          type="button"
          onClick={onBack}
          aria-label={t.back}
          className="text-on-surface hover:bg-surface-container-low transition-colors rounded-full p-2 flex items-center justify-center active:scale-95"
        >
          <span className="material-symbols-outlined no-mirror" aria-hidden="true">
            arrow_back
          </span>
        </button>
        <h1 className="font-serif text-headline-sm text-primary tracking-widest uppercase flex-grow text-center">
          {t.title}
        </h1>
        <div className="w-10" aria-hidden="true" />
      </div>

      <form onSubmit={handleSave} className="flex flex-col gap-md font-sans">
        {formError && <p role="alert" className="rounded-lg bg-error-container p-sm text-error font-bold">{formError}</p>}
        <section className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md">
          <h2 className="text-[10px] uppercase tracking-wider text-primary font-bold mb-sm">
            {t.avatarHeading}
          </h2>
          <div className="flex items-center gap-md mb-sm">
            <img
              alt={fullName || "Avatar"}
              src={avatar}
              className="w-20 h-20 rounded-full object-cover border-4 border-surface-container-low"
            />
            <div className="flex flex-col gap-xs flex-1">
              <p className="text-[11px] text-on-surface-variant leading-normal">
                {t.avatarHelp}
              </p>
              <button
                type="button"
                onClick={triggerAvatarPicker}
                disabled={avatarUploading}
                className="self-start flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary text-on-primary text-label-sm font-bold uppercase tracking-wider active:scale-95 transition-transform disabled:opacity-60"
              >
                <span
                  className="material-symbols-outlined text-[16px] no-mirror"
                  aria-hidden="true"
                >
                  {avatarUploading ? "progress_activity" : "upload"}
                </span>
                {avatarUploading ? t.avatarUploading : avatar ? t.avatarChange : t.avatarUpload}
              </button>
            </div>
          </div>
          <input
            ref={avatarInputRef}
            type="file"
            accept={LISTING_MEDIA_ALLOWED_MIME.join(",")}
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                void handleAvatarFile(file);
              }
            }}
          />
          {avatarError && (
            <p
              role="alert"
              className="text-[11px] text-error font-bold mb-sm"
            >
              {avatarError}
            </p>
          )}
          <div className="flex gap-sm flex-wrap">
            {PRESET_AVATARS.map((url) => (
              <button
                key={url}
                type="button"
                onClick={() => setAvatar(url)}
                aria-pressed={avatar === url}
                className={`relative w-14 h-14 rounded-full overflow-hidden border-2 transition-all ${
                  avatar === url
                    ? "border-primary ring-2 ring-primary/30"
                    : "border-outline-variant"
                }`}
              >
                <img alt="" src={url} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </section>

        {/* Personal info */}
        <section className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md flex flex-col gap-sm">
          <h2 className="text-[10px] uppercase tracking-wider text-primary font-bold">
            {t.personalInfo}
          </h2>

          <ProfileField
            label={t.fullName}
            placeholder={t.fullNamePh}
            value={fullName}
            onChange={setFullName}
          />
          <div className="flex flex-col gap-xs">
            <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              {t.handle}
            </label>
            <div className="flex items-center gap-2">
              <span className="text-[18px] text-outline">@</span>
              <input
                type="text"
                placeholder={t.handlePh.replace("@", "")}
                value={handle.replace("@", "")}
                onChange={(e) => setHandle(`@${e.target.value}`)}
                className="flex-grow p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
              />
            </div>
          </div>
          <div className="flex flex-col gap-xs">
            <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
              {t.bio}
            </label>
            <textarea
              rows={4}
              placeholder={t.bioPh}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
            />
          </div>
          <ProfileField
            label={t.location}
            placeholder={t.locationPh}
            value={city}
            onChange={setCity}
          />
        </section>

        {/* Style tags */}
        <section className="bg-surface-container-lowest border border-surface-container-high rounded-xl p-md">
          <h2 className="text-[10px] uppercase tracking-wider text-primary font-bold mb-1">
            {t.styleTags}
          </h2>
          <p className="text-[11px] text-on-surface-variant mb-sm">
            {t.styleTagHelp}
          </p>
          <div className="flex flex-wrap gap-sm mb-sm">
            {tags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => removeTag(tag)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-label-sm font-bold border border-primary active:scale-95 transition-transform"
              >
                {tag}
                <span
                  className="material-symbols-outlined text-[16px] no-mirror"
                  aria-hidden="true"
                >
                  close
                </span>
              </button>
            ))}
            {tags.length < 5 && (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  placeholder={t.styleTagPh}
                  value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  className="w-32 p-2 bg-surface border border-outline-variant rounded-full text-label-sm focus:border-primary outline-none"
                />
                <button
                  type="button"
                  onClick={addTag}
                  aria-label={isAr ? "إضافة" : "Add"}
                  className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center active:scale-90 transition-transform"
                >
                  <span
                    className="material-symbols-outlined text-[18px] no-mirror"
                    aria-hidden="true"
                  >
                    add
                  </span>
                </button>
              </div>
            )}
          </div>
        </section>

        <button
          type="submit"
          className="btn-primary py-4 rounded-xl text-label-md uppercase tracking-widest font-bold shadow-md active:scale-95 transition-transform"
        >
          {t.save}
        </button>
        <button
          type="button"
          onClick={onBack}
          className="text-label-sm text-on-surface-variant font-bold uppercase tracking-wider self-center active:scale-95 transition-transform"
        >
          {t.cancel}
        </button>
      </form>
    </div>
  );
};

const ProfileField: React.FC<{
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}> = ({ label, placeholder, value, onChange }) => (
  <div className="flex flex-col gap-xs">
    <label className="text-label-sm uppercase tracking-wider text-on-surface-variant font-bold">
      {label}
    </label>
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="p-md bg-surface border border-outline-variant rounded-lg text-body-md focus:border-primary outline-none"
    />
  </div>
);
