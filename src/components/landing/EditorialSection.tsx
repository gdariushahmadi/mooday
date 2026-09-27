import { LandingCopy } from "./copy";
import { Reveal } from "./Reveal";
import styles from "./landing.module.css";

interface EditorialSectionProps {
  t: LandingCopy;
}

export function EditorialSection({ t }: EditorialSectionProps) {
  return (
    <section className={styles.editorialSection} aria-label="Editorial">
      <div className={styles.editorialInner}>
        <Reveal className={styles.editorialText}>
          <blockquote className={styles.editorialQuote}>
            {t.editorial.quote}
          </blockquote>
          <cite className={styles.editorialAttribution}>
            {t.editorial.attribution}
          </cite>
        </Reveal>
        <Reveal className={styles.editorialImageWrap} delay={120}>
          <img
            src="/landing/lifestyle-flatlay.jpg"
            alt=""
            className={styles.editorialImg}
            loading="lazy"
            decoding="async"
          />
        </Reveal>
      </div>
    </section>
  );
}
