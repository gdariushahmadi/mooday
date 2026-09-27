import { LandingCopy } from "./copy";
import { Reveal } from "./Reveal";
import styles from "./landing.module.css";

interface HowItWorksSectionProps {
  t: LandingCopy;
}

export function HowItWorksSection({ t }: HowItWorksSectionProps) {
  return (
    <section className={styles.section} id="how" aria-labelledby="how-title">
      <div className={styles.sectionInner}>
        <Reveal>
          <span className={styles.eyebrow}>{t.howItWorks.eyebrow}</span>
          <h2 className={styles.sectionTitle} id="how-title">
            {t.howItWorks.title}
          </h2>
        </Reveal>

        <ol className={styles.steps}>
          {t.howItWorks.steps.map((step, idx) => (
            <Reveal key={step.title} delay={idx * 100}>
              <li className={styles.step}>
                <span className={styles.stepNum} aria-hidden="true">
                  {String(idx + 1).padStart(2, "0")}
                </span>
                <h3 className={styles.stepTitle}>{step.title}</h3>
                <p className={styles.stepBody}>{step.body}</p>
              </li>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
