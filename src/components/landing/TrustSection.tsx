import { LandingCopy } from "./copy";
import { Reveal } from "./Reveal";
import styles from "./landing.module.css";

interface TrustSectionProps {
  t: LandingCopy;
}

export function TrustSection({ t }: TrustSectionProps) {
  return (
    <section className={styles.section} id="trust" aria-labelledby="trust-title">
      <div className={styles.sectionInner}>
        <Reveal>
          <span className={styles.eyebrow}>{t.trust.eyebrow}</span>
          <h2 className={styles.sectionTitle} id="trust-title">
            {t.trust.title}
          </h2>
        </Reveal>

        <div className={styles.trustGrid}>
          {t.trust.items.map((item, idx) => (
            <Reveal key={item.title} delay={idx * 80}>
              <article className={styles.trustItem}>
                <span
                  className={`material-symbols-outlined ${styles.trustIcon}`}
                  aria-hidden="true"
                >
                  {item.icon}
                </span>
                <h3 className={styles.trustTitle}>{item.title}</h3>
                <p className={styles.trustBody}>{item.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
