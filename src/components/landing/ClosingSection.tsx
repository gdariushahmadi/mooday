import Link from "next/link";
import { LandingCopy } from "./copy";
import { Reveal } from "./Reveal";
import styles from "./landing.module.css";

interface ClosingSectionProps {
  t: LandingCopy;
  isAr: boolean;
}

export function ClosingSection({ t, isAr }: ClosingSectionProps) {
  return (
    <section className={styles.closingSection} aria-labelledby="closing-title">
      <div className={styles.closingGlow} aria-hidden="true" />
      <Reveal>
        <div className={styles.closingInner}>
          <p className={styles.closingBrand}>Mooday</p>
          <h2 className={styles.closingTitle} id="closing-title">
            {t.closing.title}
          </h2>
          <p className={styles.closingBody}>{t.closing.body}</p>
          <Link href="/app" className={styles.closingCta}>
            {t.closing.cta}
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
              style={{ transform: isAr ? "scaleX(-1)" : undefined }}
            >
              arrow_forward
            </span>
          </Link>
        </div>
      </Reveal>
    </section>
  );
}
