import Link from "next/link";
import { COPY, type Lang } from "./copy";
import { LangToggle } from "./LangToggle";
import { Reveal } from "./Reveal";
import { LandingInstallPrompt } from "./LandingInstallPrompt";
import styles from "./landing.module.css";

interface LandingProps {
  lang: Lang;
}

// Server component — layout is prerenderable. Only language toggle,
// install prompt, and scroll-reveal ship as client JS.
export function Landing({ lang }: LandingProps) {
  const t = COPY[lang];
  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";

  return (
    <div lang={lang} dir={dir} className={styles.landing}>
      <div className={styles.grain} aria-hidden="true" />

      {/* ============== Top bar ============== */}
      <header className={styles.nav}>
        <a href="#top" className={styles.navBrand}>
          Mooday
        </a>
        <nav className={styles.navLinks} aria-label="Primary">
          <a href="#categories">{t.nav.discover}</a>
          <a href="#how">{t.nav.how}</a>
          <a href="#trust">{t.nav.trust}</a>
        </nav>
        <div className={styles.navActions}>
          <LangToggle lang={lang} />
          <Link href="/app" className={styles.navCta}>
            {t.nav.open}
          </Link>
        </div>
      </header>

      {/* ============== Hero — brand-first, full-bleed ============== */}
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

      {/* ============== Pulse strip (below fold) ============== */}
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

      {/* ============== Piece marquee ============== */}
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

      {/* ============== Value props ============== */}
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

      {/* ============== Categories mosaic ============== */}
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

      {/* ============== Lifestyle split ============== */}
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

      {/* ============== How it works ============== */}
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

      {/* ============== Editorial ============== */}
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

      {/* ============== Trust ============== */}
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

      {/* ============== Closing ============== */}
      <section className={styles.closingSection} aria-labelledby="closing-title">
        <div className={styles.closingGlow} aria-hidden="true" />
        <Reveal>
          <div className={styles.closingInner}>
            <p className={styles.closingBrand}>Mooday</p>
            <h2 className={styles.closingTitle} id="closing-title">
              {t.closing.title}
            </h2>
            <p className={styles.closingBody}>{t.closing.body}</p>
            <Link href="/app" className={styles.closingCta}>
              {t.closing.cta}
              <span
                className="material-symbols-outlined"
                aria-hidden="true"
                style={{ transform: isAr ? "scaleX(-1)" : undefined }}
              >
                arrow_forward
              </span>
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ============== Footer ============== */}
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

      <LandingInstallPrompt lang={lang} />
    </div>
  );
}
