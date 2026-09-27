import Link from "next/link";
import { LandingCopy } from "./copy";
import { Reveal } from "./Reveal";
import styles from "./landing.module.css";

interface LifestyleSectionProps {
  t: LandingCopy;
  isAr: boolean;
}

export function LifestyleSection({ t, isAr }: LifestyleSectionProps) {
  return (
    <section
      className={styles.splitSection}
      id="lifestyle"
      aria-labelledby="lifestyle-title"
    >
      <div className={styles.splitMedia}>
        <Reveal className={styles.splitImageWrap}>
          <img
            src="/landing/lifestyle-touch.jpg"
            alt=""
            className={styles.splitImage}
            loading="lazy"
            decoding="async"
          />
        </Reveal>
      </div>
      <div className={styles.splitCopy}>
        <Reveal delay={100}>
          <span className={styles.splitEyebrow}>{t.lifestyle.eyebrow}</span>
          <h2 className={styles.splitTitle} id="lifestyle-title">
            {t.lifestyle.title}
          </h2>
          <p className={styles.splitBody}>{t.lifestyle.body}</p>
          <Link href="/app?view=search" className={styles.splitCta}>
            {t.lifestyle.cta}
            <span
              className="material-symbols-outlined"
              aria-hidden="true"
              style={{ transform: isAr ? "scaleX(-1)" : undefined }}
            >
              arrow_forward
            </span>
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
