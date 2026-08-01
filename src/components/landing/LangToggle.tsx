"use client";

// Language switch — kept tiny and progressive.
// We navigate (?lang=en / ?lang=ar) so the server can prerender the right
// direction + strings per share on social.

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LANGS, type Lang } from "./copy";
import styles from "./landing.module.css";

export function LangToggle({ lang }: { lang: Lang }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  function go(next: Lang) {
    if (next === lang) return;
    const sp = new URLSearchParams(params.toString());
    if (next === "ar") sp.set("lang", "ar");
    else sp.delete("lang");
    const qs = sp.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div role="group" aria-label="Language" className={styles.langToggle}>
      {LANGS.map((l) => {
        const active = l.code === lang;
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => go(l.code)}
            aria-pressed={active}
            lang={l.code}
            className={`${styles.langBtn} ${active ? styles.langBtnActive : ""}`}
          >
            {l.iso}
          </button>
        );
      })}
    </div>
  );
}
