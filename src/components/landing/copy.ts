// All bilingual copy for the marketing landing page.
// Two languages: English (LTR) and Arabic (RTL). Switched via `?lang=ar` on
// the URL — keeps the page server-renderable for SEO / share previews.

export type Lang = "en" | "ar";

export const LANGS: ReadonlyArray<{ code: Lang; native: string; iso: string }> = [
  { code: "en", native: "English", iso: "EN" },
  { code: "ar", native: "العربية", iso: "AR" },
];

type Stat = { value: string; label: string };
type ValueProp = { title: string; body: string; icon: string; badge?: string };
type CategoryTile = {
  key: string;
  name: string;
  image?: string;
  span?: "wide" | "tall" | "normal";
  fallback?: { gradient: string; icon: string };
};

export type LandingCopy = {
  metaTitle: string;
  metaDescription: string;
  nav: { discover: string; how: string; trust: string; open: string };
  hero: {
    brand: string;
    /** Large outlined ghost word behind the brand — magazine layering */
    ghost: string;
    /** Vertical folio label at the edge of the hero */
    folio: string;
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    scrollCue: string;
  };
  pulse: {
    aria: string;
    stats: Stat[];
  };
  marquee: {
    aria: string;
    items: { name: string; image: string; href: string }[];
  };
  valueProps: { eyebrow: string; title: string; items: ValueProp[] };
  categories: { eyebrow: string; title: string; subtitle: string; tiles: CategoryTile[] };
  lifestyle: {
    eyebrow: string;
    title: string;
    body: string;
    cta: string;
  };
  howItWorks: {
    eyebrow: string;
    title: string;
    steps: { title: string; body: string }[];
  };
  editorial: {
    quote: string;
    attribution: string;
  };
  trust: {
    eyebrow: string;
    title: string;
    items: { title: string; body: string; icon: string }[];
  };
  closing: {
    title: string;
    body: string;
    cta: string;
  };
  footer: {
    tagline: string;
    columns: { heading: string; links: { label: string; href: string }[] }[];
    legal: string;
    rights: string;
  };
};

export const COPY: Record<Lang, LandingCopy> = {
  en: {
    metaTitle: "DANEG — Pre-loved luxury. Authenticated.",
    metaDescription:
      "A public Demo/Beta marketplace for women in the UAE to browse and list pre-loved fashion. Demo orders are saved in the browser. No payment is taken.",
    nav: {
      discover: "Discover",
      how: "How it works",
      trust: "Why DANEG",
      open: "Open the app",
    },
    hero: {
      brand: "DANEG",
      ghost: "Wardrobe",
      folio: "Vol. 01 — UAE",
      title: "Pre-loved fashion, beautifully lived in.",
      subtitle:
        "The UAE marketplace where women can discover and list pieces they love. This public beta includes a clear, no-charge Demo checkout.",
      ctaPrimary: "Open DANEG",
      ctaSecondary: "Browse pieces",
      scrollCue: "Discover",
    },
    pulse: {
      aria: "Platform highlights",
      stats: [
        { value: "Demo", label: "Checkout mode" },
        { value: "1", label: "Listing per order" },
        { value: "AED 0", label: "Payment taken" },
        { value: "UAE", label: "Built for here" },
      ],
    },
    marquee: {
      aria: "Featured pieces drifting by",
      items: [
        { name: "Bags", image: "/landing/cat-bags.jpg", href: "/app?view=category&category=Bags" },
        { name: "Shoes", image: "/landing/cat-shoes.jpg", href: "/app?view=category&category=Shoes" },
        { name: "Dresses", image: "/landing/cat-dresses.jpg", href: "/app?view=category&category=Dresses" },
        {
          name: "Accessories",
          image: "/landing/cat-accessories.jpg",
          href: "/app?view=category&category=Accessories",
        },
        { name: "Clothing", image: "/landing/cat-clothing.jpg", href: "/app?view=category&category=Clothing" },
        {
          name: "The edit",
          image: "/landing/lifestyle-flatlay.jpg",
          href: "/app?view=search",
        },
      ],
    },
    valueProps: {
      eyebrow: "One wardrobe, shared",
      title: "Sell, rent, and shop — without the middleman.",
      items: [
        {
          title: "Sell in minutes",
          body: "Snap a few photos, name your price, and list a piece from your closet for someone else's story.",
          icon: "storefront",
        },
        {
          title: "Rent designer",
          body: "Borrow the dress for the wedding. Pay the seller, wear it for the weekend, return it clean.",
          icon: "schedule",
          badge: "Coming soon",
        },
        {
          title: "Try the Demo checkout",
          body: "Review one listing and save a clearly labelled Demo order. No payment, card number, or CVV is requested.",
          icon: "verified_user",
        },
      ],
    },
    categories: {
      eyebrow: "The edit",
      title: "Every piece has a past. Find yours.",
      subtitle: "Hand-picked pre-loved across bags, shoes, dresses, and more.",
      tiles: [
        { key: "bags", name: "Bags", image: "/landing/cat-bags.jpg", span: "tall" },
        { key: "shoes", name: "Shoes", image: "/landing/cat-shoes.jpg" },
        { key: "dresses", name: "Dresses", image: "/landing/cat-dresses.jpg", span: "wide" },
        { key: "accessories", name: "Accessories", image: "/landing/cat-accessories.jpg" },
        { key: "clothing", name: "Clothing", image: "/landing/cat-clothing.jpg" },
        {
          key: "all",
          name: "Browse all",
          span: "wide",
          fallback: {
            gradient: "linear-gradient(145deg, #071714 0%, #11302d 55%, #96650f 140%)",
            icon: "arrow_forward",
          },
        },
],
    },
    lifestyle: {
      eyebrow: "From their closet to yours",
      title: "Loved first by women across the Emirates.",
      body: "Every DANEG seller is a real person with a real wardrobe. Browse profiles, follow the curators you trust, and message them directly — no middlemen, no markup on the conversation.",
      cta: "Meet our sellers",
    },
    howItWorks: {
      eyebrow: "How DANEG works",
      title: "From closet to wardrobe in three steps.",
      steps: [
        {
          title: "Discover",
          body: "Browse curated feeds, search by brand, size, colour, or condition. Save pieces you love to your Vault.",
        },
        {
          title: "Chat & offer",
          body: "Message the seller directly. Ask questions, request photos, or make an offer. The conversation is the deal.",
        },
        {
          title: "Demo checkout",
          body: "Choose an address and save a Demo receipt in this browser. No charge, payment, shipment, escrow, or seller payout is created.",
        },
      ],
    },
    editorial: {
      quote:
        "I wore my friend's DANEG dress twice last month. Now I've sold three of my own. It's the wardrobe I always wanted, shared.",
      attribution: "Latifa · DANEG seller, Dubai",
    },
    trust: {
      eyebrow: "Why DANEG",
      title: "Designed for trust, built for women.",
      items: [
        {
          title: "Verified sellers",
          body: "Profile reviews, response rate, and verified-purchase badges on every transaction.",
          icon: "badge",
        },
        {
          title: "Clear Demo boundaries",
          body: "Demo orders are labelled and stored only in your browser. Real payment and seller payout features are not active.",
          icon: "shield",
        },
        {
          title: "Future-ready policies",
          body: "Real returns, payment protection, and payouts will be published and enabled in a later phase.",
          icon: "undo",
        },
      ],
    },
    closing: {
      title: "Find your next favourite thing.",
      body: "Free to browse and list in the public beta. Demo checkout takes no payment and stores the receipt in this browser.",
      cta: "Open DANEG",
    },
    footer: {
      tagline: "A peer-to-peer marketplace for women in the UAE.",
      columns: [
        {
          heading: "App",
          links: [
            { label: "Open DANEG", href: "/app" },
            { label: "Sell an item", href: "/app?view=sell" },
            { label: "My Vault", href: "/app?view=profile" },
          ],
        },
        {
          heading: "Discover",
          links: [
            { label: "Bags", href: "/app?view=category&category=Bags" },
            { label: "Shoes", href: "/app?view=category&category=Shoes" },
            { label: "Dresses", href: "/app?view=category&category=Dresses" },
          ],
        },
        {
          heading: "Company",
          links: [
            { label: "About DANEG", href: "/app?view=help" },
            { label: "Community guidelines", href: "/app?view=help" },
            { label: "Help & support", href: "/app?view=help" },
          ],
        },
        {
          heading: "Legal",
          links: [
            { label: "Privacy", href: "/legal/privacy" },
            { label: "Terms", href: "/legal/terms" },
            { label: "Returns & refunds", href: "/legal/refunds" },
          ],
        },
      ],
      legal: "DANEG public Demo/Beta. Real payments and seller payouts are not active.",
      rights: "All rights reserved.",
    },
  },

  ar: {
    metaTitle: "دانق — أزياء فاخرة محبوبة. معتمدة.",
    metaDescription:
      "نسخة تجريبية عامة من دانق للنساء في الإمارات لتصفح الأزياء المحبوبة وإضافتها. تُحفظ الطلبات التجريبية في المتصفح فقط ولا يتم خصم أي مبلغ.",
    nav: {
      discover: "اكتشفي",
      how: "كيف يعمل",
      trust: "لماذا دانق",
      open: "افتحي التطبيق",
    },
    hero: {
      brand: "DANEG",
      ghost: "خزانة",
      folio: "المجلد ٠١ — الإمارات",
      title: "أزياء محبوبة، عاشت بأناقة.",
      subtitle:
        "سوق الإمارات حيث تبيع النساء وتؤجّرن القطع التي يحببنها — ويجدنَ قطعتهنّ المفضلة التالية.",
      ctaPrimary: "افتحي دانق",
      ctaSecondary: "تصفّحي القطع",
      scrollCue: "اكتشفي",
    },
    pulse: {
      aria: "أبرز الأرقام",
      stats: [
        { value: "تجريبي", label: "وضع الطلب" },
        { value: "١", label: "قطعة في الطلب" },
        { value: "٠ د.إ", label: "المبلغ المخصوم" },
        { value: "الإمارات", label: "مبنية هنا" },
      ],
    },
    marquee: {
      aria: "قطع مختارة تمرّ أمامك",
      items: [
        { name: "حقائب", image: "/landing/cat-bags.jpg", href: "/app?view=category&category=Bags" },
        { name: "أحذية", image: "/landing/cat-shoes.jpg", href: "/app?view=category&category=Shoes" },
        { name: "فساتين", image: "/landing/cat-dresses.jpg", href: "/app?view=category&category=Dresses" },
        {
          name: "إكسسوارات",
          image: "/landing/cat-accessories.jpg",
          href: "/app?view=category&category=Accessories",
        },
        { name: "ملابس", image: "/landing/cat-clothing.jpg", href: "/app?view=category&category=Clothing" },
        {
          name: "المختارات",
          image: "/landing/lifestyle-flatlay.jpg",
          href: "/app?view=search",
        },
      ],
    },
    valueProps: {
      eyebrow: "خزانة واحدة مشتركة",
      title: "بيع، تأجير، وتسوّق — بلا وسطاء.",
      items: [
        {
          title: "بيع في دقائق",
          body: "صوّري قطعة من خزانتك، حدّدي السعر، وأضيفيها لمن يحبّها قصة جديدة.",
          icon: "storefront",
        },
        {
          title: "استأجري من المصمّمين",
          body: "استعيري الفستان لحفل الزفاف. ادفعي للبائعة، ارتديه في العطلة، وأعيديه نظيفًا.",
          icon: "schedule",
          badge: "قريبًا",
        },
        {
          title: "جرّبي الطلب التجريبي",
          body: "راجعي قطعة واحدة واحفظي طلباً تجريبياً واضحاً. لا نطلب أو نحفظ رقم البطاقة أو CVV ولا نخصم أي مبلغ.",
          icon: "verified_user",
        },
      ],
    },
    categories: {
      eyebrow: "المختارات",
      title: "لكل قطعة قصة. دُوري على قصتك.",
      subtitle: "قطع مختارة بعناية من الحقائب والأحذية والفساتين وغيرها.",
      tiles: [
        { key: "bags", name: "حقائب", image: "/landing/cat-bags.jpg", span: "tall" },
        { key: "shoes", name: "أحذية", image: "/landing/cat-shoes.jpg" },
        { key: "dresses", name: "فساتين", image: "/landing/cat-dresses.jpg", span: "wide" },
        { key: "accessories", name: "إكسسوارات", image: "/landing/cat-accessories.jpg" },
        { key: "clothing", name: "ملابس", image: "/landing/cat-clothing.jpg" },
        {
          key: "all",
          name: "كل الفئات",
          span: "wide",
          fallback: {
            gradient: "linear-gradient(145deg, #071714 0%, #11302d 55%, #96650f 140%)",
            icon: "arrow_forward",
          },
        },
],
    },
    lifestyle: {
      eyebrow: "من خزائنهنّ إلى خزانتك",
      title: "حظي بها أولاً نساء من كل الإمارات.",
      body: "كل بائعة على دانق شخص حقيقي وخزانة حقيقية. تصفّحي بروفايلاتهنّ، تابعي من تثقين باختيارها، وراسلنه مباشرة — بلا وسطاء.",
      cta: "تعرّفي على البائعات",
    },
    howItWorks: {
      eyebrow: "كيف تعمل دانق",
      title: "من الخزانة إلى دولابك في ثلاث خطوات.",
      steps: [
        {
          title: "اكتشفي",
          body: "تصفّحي الخلاصات المنسّقة، ابحثي بالماركة أو المقاس أو اللون أو الحالة. أضيفي ما يعجبك إلى خزانتك.",
        },
        {
          title: "راسلي وقدّمي عرضًا",
          body: "راسلي البائعة مباشرة. اسألي، اطلبي صورًا إضافية، وقدّمي عرضًا. المحادثة هي الاتفاق.",
        },
        {
          title: "الطلب التجريبي",
          body: "اختاري العنوان واحفظي إيصالاً تجريبياً في هذا المتصفح. لا يتم إنشاء دفع أو شحن أو ضمان أو تحويل أرباح حقيقي.",
        },
      ],
    },
    editorial: {
      quote:
        "ارتديت فستان صديقتي من دانق مرتين الشهر الماضي. والآن بعتُ ثلاثًا من قطعِي. إنه الخزانة التي طالما أردتُها، مشتركة.",
      attribution: "لطيفة · بائعة دانق، دبي",
    },
    trust: {
      eyebrow: "لماذا دانق",
      title: "مصمَّمة للثقة، مبنية للنساء.",
      items: [
        {
          title: "بائعات موثّقات",
          body: "تقييمات بروفايل، معدّل الرد، وشارة شراء موثّق على كل عملية.",
          icon: "badge",
        },
        {
          title: "حدود تجريبية واضحة",
          body: "تُعرّف الطلبات التجريبية بوضوح وتُحفظ في المتصفح فقط. الدفع وتحويل أرباح البائعين غير مفعّلين.",
          icon: "shield",
        },
        {
          title: "سياسات للمرحلة القادمة",
          body: "سيتم نشر وتفعيل الدفع والحماية والإرجاع وتحويل الأرباح في مرحلة لاحقة.",
          icon: "undo",
        },
      ],
    },
    closing: {
      title: "دوّري على حبّك القادم.",
      body: "التصفح والإضافة مجانيان في النسخة العامة. الطلب التجريبي لا يخصم مبلغاً ويحفظ الإيصال في هذا المتصفح.",
      cta: "افتحي دانق",
    },
    footer: {
      tagline: "سوق نظير-لنظير للنساء في الإمارات.",
      columns: [
        {
          heading: "التطبيق",
          links: [
            { label: "افتحي دانق", href: "/app" },
            { label: "بيعي قطعة", href: "/app?view=sell" },
            { label: "خزانتي", href: "/app?view=profile" },
          ],
        },
        {
          heading: "اكتشفي",
          links: [
            { label: "حقائب", href: "/app?view=category&category=Bags" },
            { label: "أحذية", href: "/app?view=category&category=Shoes" },
            { label: "فساتين", href: "/app?view=category&category=Dresses" },
          ],
        },
        {
          heading: "الشركة",
          links: [
            { label: "عن دانق", href: "/app?view=help" },
            { label: "إرشادات المجتمع", href: "/app?view=help" },
            { label: "المساعدة", href: "/app?view=help" },
          ],
        },
        {
          heading: "قانوني",
          links: [
            { label: "الخصوصية", href: "/legal/privacy" },
            { label: "الشروط", href: "/legal/terms" },
            { label: "الإرجاع والاسترداد", href: "/legal/refunds" },
          ],
        },
      ],
      legal: "دانق — نسخة تجريبية عامة. الدفع وتحويل أرباح البائعين غير مفعّلين.",
      rights: "جميع الحقوق محفوظة.",
    },
  },
};
