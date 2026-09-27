import Link from "next/link";
import { LandingCopy } from "./copy";
import styles from "./landing.module.css";

interface FooterSectionProps {
  t: LandingCopy;
}

export function FooterSection({ t }: FooterSectionProps) {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        <div className={styles.footerBrand}>
          <h3>Mooday</h3>
          <p>{t.footer.tagline}</p>
        </div>
        {t.footer.columns.map((col) => (
          <div key={col.heading} className={styles.footerCol}>
            <h4>{col.heading}</h4>
            <ul>
              {col.links.map((link) => (
                <li key={link.label}>
                  {link.href.startsWith("/") ? (
                    <Link href={link.href}>{link.label}</Link>
                  ) : (
                    <a href={link.href}>{link.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className={styles.footerBottom}>
        <span>
          © {new Date().getFullYear()} Mooday · {t.footer.rights}
        </span>
        <span>{t.footer.legal}</span>
      </div>
    </footer>
  );
}
