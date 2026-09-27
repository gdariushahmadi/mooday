import Link from "next/link";
import { LandingCopy } from "./copy";
import { Reveal } from "./Reveal";
import styles from "./landing.module.css";

interface CategoriesSectionProps {
  t: LandingCopy;
  isAr: boolean;
}

export function CategoriesSection({ t, isAr }: CategoriesSectionProps) {
  return (
    <section
      className={`${styles.section} ${styles.categoriesSection}`}
      id="categories"
      aria-labelledby="categories-title"
    >
      <div className={styles.sectionInner}>
        <Reveal>
          <span className={styles.eyebrow}>{t.categories.eyebrow}</span>
          <h2 className={styles.sectionTitle} id="categories-title">
            {t.categories.title}
          </h2>
          <p className={styles.sectionLead}>{t.categories.subtitle}</p>
        </Reveal>

        <div className={styles.mosaic}>
          {t.categories.tiles.map((tile, idx) => {
            const href =
              tile.key === "all"
                ? "/app?view=search"
                : `/app?view=category&category=${tile.key.charAt(0).toUpperCase()}${tile.key.slice(1)}`;
            const spanClass =
              tile.span === "tall"
                ? styles.spanTall
                : tile.span === "wide"
                  ? styles.spanWide
                  : "";
            return (
              <Reveal key={tile.key} delay={idx * 50} className={spanClass}>
                <Link href={href} className={styles.mosaicTile}>
                  {tile.image ? (
                    <img
                      src={tile.image}
                      alt=""
                      className={styles.mosaicImg}
                      loading={idx < 3 ? "eager" : "lazy"}
                      decoding="async"
                    />
                  ) : (
                    <div
                      className={styles.mosaicFallback}
                      style={{ background: tile.fallback?.gradient }}
                      aria-hidden="true"
                    />
                  )}
                  <div className={styles.mosaicShade} aria-hidden="true" />
                  <div className={styles.mosaicCaption}>
                    <h3 className={styles.mosaicName}>{tile.name}</h3>
                    <span
                      className={styles.mosaicArrow}
                      aria-hidden="true"
                      style={{ transform: isAr ? "scaleX(-1)" : undefined }}
                    >
                      <span className="material-symbols-outlined">arrow_forward</span>
                    </span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
