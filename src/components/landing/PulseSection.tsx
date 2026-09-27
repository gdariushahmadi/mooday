import { LandingCopy } from "./copy";
import styles from "./landing.module.css";

interface PulseSectionProps {
  t: LandingCopy;
}

export function PulseSection({ t }: PulseSectionProps) {
  return (
    <section className={styles.pulse} id="pulse" aria-label={t.pulse.aria}>
      <div className={styles.pulseInner}>
        {t.pulse.stats.map((s) => (
          <div key={s.label} className={styles.pulseItem}>
            <span className={styles.pulseValue}>{s.value}</span>
            <span className={styles.pulseLabel}>{s.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
