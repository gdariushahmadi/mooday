import Link from "next/link";
import { LandingCopy, Lang } from "./copy";
import { LangToggle } from "./LangToggle";
import styles from "./landing.module.css";

interface TopNavProps {
  t: LandingCopy;
  lang: Lang;
}

export function TopNav({ t, lang }: TopNavProps) {
  return (
    <header className={styles.nav}>
      <a href="#top" className={styles.navBrand}>
        Mooday
      </a>
      <nav className={styles.navLinks} aria-label="Primary">
        <a href="#categories">{t.nav.discover}</a>
        <a href="#how">{t.nav.how}</a>
        <a href="#trust">{t.nav.trust}</a>
      </nav>
      <div className={styles.navActions}>
        <LangToggle lang={lang} />
        <Link href="/app" className={styles.navCta}>
          {t.nav.open}
        </Link>
      </div>
    </header>
  );
}
