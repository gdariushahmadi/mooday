import Link from "next/link";
import { LandingCopy } from "./copy";
import styles from "./landing.module.css";

interface HeroSectionProps {
  t: LandingCopy;
  isAr: boolean;
}

export function HeroSection({ t, isAr }: HeroSectionProps) {
  return (
    <section className={styles.hero} id="top" aria-labelledby="hero-brand">
      <video
        src="/landing/mooday_hero.mp4"
        className={styles.heroImg}
        autoPlay
        muted
        loop
        playsInline
      />
      <div className={styles.heroVeil} aria-hidden="true" />

      {/* Magazine layers: ghost word + vertical folio */}
      <span className={styles.heroGhost} aria-hidden="true">
        {t.hero.ghost}
      </span>
      <span className={styles.heroFolio} aria-hidden="true">
        {t.hero.folio}
      </span>

      <div className={styles.heroContent}>
        <div className={styles.heroBrandStack}>
          <h1 className={styles.heroBrand} id="hero-brand">
            {t.hero.brand}
          </h1>
          <span className={styles.heroBrandRule} aria-hidden="true" />
        </div>
        <p className={styles.heroTitle}>{t.hero.title}</p>
        <p className={styles.heroSubtitle}>{t.hero.subtitle}</p>
        <div className={styles.heroActions}>
          <Link href="/app" className={styles.ctaPrimary}>
            {t.hero.ctaPrimary}
            <span
              className={`material-symbols-outlined ${styles.ctaIcon}`}
              aria-hidden="true"
              style={{ transform: isAr ? "scaleX(-1)" : undefined }}
            >
              arrow_forward
            </span>
          </Link>
          <a href="#categories" className={styles.ctaGhost}>
            {t.hero.ctaSecondary}
          </a>
        </div>
      </div>

      <a href="#pulse" className={styles.scrollCue} aria-label={t.hero.scrollCue}>
        <span>{t.hero.scrollCue}</span>
        <span className={styles.scrollLine} aria-hidden="true" />
      </a>
    </section>
  );
}
