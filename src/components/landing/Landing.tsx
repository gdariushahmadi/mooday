import { COPY, type Lang } from "./copy";
import { LandingInstallPrompt } from "./LandingInstallPrompt";
import { TopNav } from "./TopNav";
import { HeroSection } from "./HeroSection";
import { PulseSection } from "./PulseSection";
import { MarqueeSection } from "./MarqueeSection";
import { ValuePropsSection } from "./ValuePropsSection";
import { CategoriesSection } from "./CategoriesSection";
import { LifestyleSection } from "./LifestyleSection";
import { HowItWorksSection } from "./HowItWorksSection";
import { EditorialSection } from "./EditorialSection";
import { TrustSection } from "./TrustSection";
import { ClosingSection } from "./ClosingSection";
import { FooterSection } from "./FooterSection";
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
      <TopNav t={t} lang={lang} />

      {/* ============== Hero — brand-first, full-bleed ============== */}
      <HeroSection t={t} isAr={isAr} />

      {/* ============== Pulse strip (below fold) ============== */}
      <PulseSection t={t} />

      {/* ============== Piece marquee ============== */}
      <MarqueeSection t={t} />

      {/* ============== Value props ============== */}
      <ValuePropsSection t={t} />

      {/* ============== Categories mosaic ============== */}
      <CategoriesSection t={t} isAr={isAr} />

      {/* ============== Lifestyle split ============== */}
      <LifestyleSection t={t} isAr={isAr} />

      {/* ============== How it works ============== */}
      <HowItWorksSection t={t} />

      {/* ============== Editorial ============== */}
      <EditorialSection t={t} />

      {/* ============== Trust ============== */}
      <TrustSection t={t} />

      {/* ============== Closing ============== */}
      <ClosingSection t={t} isAr={isAr} />

      {/* ============== Footer ============== */}
      <FooterSection t={t} />

      <LandingInstallPrompt lang={lang} />
    </div>
  );
}
