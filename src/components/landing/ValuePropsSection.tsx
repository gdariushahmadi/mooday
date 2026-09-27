import { LandingCopy } from "./copy";
import { Reveal } from "./Reveal";
import styles from "./landing.module.css";

interface ValuePropsSectionProps {
  t: LandingCopy;
}

export function ValuePropsSection({ t }: ValuePropsSectionProps) {
  return (
    <section className={styles.section} id="why" aria-labelledby="value-title">
      <div className={styles.sectionInner}>
        <Reveal>
          <span className={styles.eyebrow}>{t.valueProps.eyebrow}</span>
          <h2 className={styles.sectionTitle} id="value-title">
            {t.valueProps.title}
          </h2>
        </Reveal>

        <div className={styles.valueGrid}>
          {t.valueProps.items.map((vp, idx) => (
            <Reveal key={vp.title} delay={idx * 90}>
              <article className={styles.valueItem}>
                <div className={styles.valueMeta}>
                  <span className={styles.valueIndex} aria-hidden="true">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  {vp.badge && (
                    <span className={styles.valueBadge}>{vp.badge}</span>
                  )}
                </div>
                <h3 className={styles.valueTitle}>{vp.title}</h3>
                <p className={styles.valueBody}>{vp.body}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
