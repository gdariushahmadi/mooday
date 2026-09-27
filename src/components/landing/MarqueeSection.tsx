import Link from "next/link";
import { LandingCopy } from "./copy";
import styles from "./landing.module.css";

interface MarqueeSectionProps {
  t: LandingCopy;
}

export function MarqueeSection({ t }: MarqueeSectionProps) {
  return (
    <section className={styles.marquee} aria-label={t.marquee.aria}>
      <div className={styles.marqueeTrack}>
        {[0, 1].map((loop) => (
          <div
            key={loop}
            className={styles.marqueeGroup}
            aria-hidden={loop === 1 ? true : undefined}
          >
            {t.marquee.items.map((item) => (
              <Link
                key={`${loop}-${item.name}`}
                href={item.href}
                className={styles.marqueeCard}
                tabIndex={loop === 1 ? -1 : undefined}
              >
                <img
                  src={item.image}
                  alt=""
                  className={styles.marqueeImg}
                  loading="lazy"
                  decoding="async"
                />
                <span className={styles.marqueeName}>{item.name}</span>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
