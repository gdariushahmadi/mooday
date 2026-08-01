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
    metaTitle: "Mooday — Resell & rent pre-loved fashion in the UAE",
    metaDescription:
      "A peer-to-peer marketplace for women in the UAE to resell or rent out the dresses, shoes, bags, and accessories they bought or received as gifts.",
    nav: {
      discover: "Discover",
      how: "How it works",
      trust: "Why Mooday",
      open: "Open the app",
    },
    hero: {
      brand: "Mooday",
      ghost: "Wardrobe",
      folio: "Vol. 01 — UAE",
      title: "Pre-loved fashion, beautifully lived in.",
      subtitle:
        "The UAE marketplace where women resell and rent the pieces they love — and find their next favourite thing.",
      ctaPrimary: "Open Mooday",
      ctaSecondary: "Browse pieces",
      scrollCue: "Discover",
    },
    pulse: {
      aria: "Platform highlights",
      stats: [
        { value: "12k+", label: "Pieces listed" },
        { value: "AED 5k", label: "Median sale" },
        { value: "48 h", label: "Seller payout" },
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
          title: "Buy with escrow",
          body: "Every purchase is held safely until the piece arrives and matches its listing.",
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
            gradient: "linear-gradient(145deg, #2a1224 0%, #512443 55%, #8a6510 140%)",
            icon: "arrow_forward",
          },
        },
      ],
    },
    lifestyle: {
      eyebrow: "From their closet to yours",
      title: "Loved first by women across the Emirates.",
      body: "Every Mooday seller is a real person with a real wardrobe. Browse profiles, follow the curators you trust, and message them directly — no middlemen, no markup on the conversation.",
      cta: "Meet our sellers",
    },
    howItWorks: {
      eyebrow: "How Mooday works",
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
          title: "Escrow checkout",
          body: "Pay through Mooday. Funds are released to the seller only after the piece arrives and you're happy.",
        },
      ],
    },
    editorial: {
      quote:
        "I wore my friend's Mooday dress twice last month. Now I've sold three of my own. It's the wardrobe I always wanted, shared.",
      attribution: "Latifa · Mooday seller, Dubai",
    },
    trust: {
      eyebrow: "Why Mooday",
      title: "Designed for trust, built for women.",
      items: [
        {
          title: "Verified sellers",
          body: "Profile reviews, response rate, and verified-purchase badges on every transaction.",
          icon: "badge",
        },
        {
          title: "Escrow protection",
          body: "Your money is held safely until the piece arrives and matches its listing.",
          icon: "shield",
        },
        {
          title: "Free returns",
          body: "If it doesn't match the description, request a return within 48 hours of delivery.",
          icon: "undo",
        },
      ],
    },
    closing: {
      title: "Find your next favourite thing.",
      body: "Free to browse, free to list. The rest of your wardrobe is waiting.",
      cta: "Open Mooday",
    },
    footer: {
      tagline: "A peer-to-peer marketplace for women in the UAE.",
      columns: [
        {
          heading: "App",
          links: [
            { label: "Open Mooday", href: "/app" },
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
            { label: "About Mooday", href: "/app?view=help" },
            { label: "Community guidelines", href: "/app?view=help" },
            { label: "Help & support", href: "/app?view=help" },
          ],
        },
        {
          heading: "Legal",
          links: [
            { label: "Privacy", href: "/app?view=help" },
            { label: "Terms", href: "/app?view=help" },
            { label: "Escrow policy", href: "/app?view=help" },
          ],
        },
      ],
      legal: "Mooday is a marketplace operated by Mooday FZ-LLC, UAE.",
      rights: "All rights reserved.",
    },
  },

  ar: {
    metaTitle: "موداي — بيعي وأَجّيري ملابسك المستعملة في الإمارات",
    metaDescription:
      "سوق نظير-لنظير للنساء في الإمارات لبيع وتأجير الفساتين والأحذية والحقائب والإكسسوارات التي اشترينها أو تلقينها كهدايا.",
    nav: {
      discover: "اكتشفي",
      how: "كيف يعمل",
      trust: "لماذا موداي",
      open: "افتحي التطبيق",
    },
    hero: {
      brand: "Mooday",
      ghost: "خزانة",
      folio: "المجلد ٠١ — الإمارات",
      title: "أزياء محبوبة، عاشت بأناقة.",
      subtitle:
        "سوق الإمارات حيث تبيع النساء وتؤجّرن القطع التي يحببنها — ويجدنَ قطعتهنّ المفضلة التالية.",
      ctaPrimary: "افتحي موداي",
      ctaSecondary: "تصفّحي القطع",
      scrollCue: "اكتشفي",
    },
    pulse: {
      aria: "أبرز الأرقام",
      stats: [
        { value: "+١٢ ألف", label: "قطعة معروضة" },
        { value: "٥ آلاف د.إ", label: "متوسط البيع" },
        { value: "٤٨ ساعة", label: "تحصيل البائعة" },
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
          title: "اشتري بأمان",
          body: "كل عملية محمية حتى تصلك القطعة وتطابق وصفها.",
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
            gradient: "linear-gradient(145deg, #2a1224 0%, #512443 55%, #8a6510 140%)",
            icon: "arrow_forward",
          },
        },
      ],
    },
    lifestyle: {
      eyebrow: "من خزائنهنّ إلى خزانتك",
      title: "حظي بها أولاً نساء من كل الإمارات.",
      body: "كل بائعة على موداي شخص حقيقي وخزانة حقيقية. تصفّحي بروفايلاتهنّ، تابعي من تثقين باختيارها، وراسلنه مباشرة — بلا وسطاء.",
      cta: "تعرّفي على البائعات",
    },
    howItWorks: {
      eyebrow: "كيف تعمل موداي",
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
          title: "الدفع عبر موداي",
          body: "ادفعي بأمان عبر موداي. لا يُحوَّل المبلغ للبائعة حتى تصلكِ القطعة وترضيها.",
        },
      ],
    },
    editorial: {
      quote:
        "ارتديت فستان صديقتي من موداي مرتين الشهر الماضي. والآن بعتُ ثلاثًا من قطعِي. إنه الخزانة التي طالما أردتُها، مشتركة.",
      attribution: "لطيفة · بائعة موداي، دبي",
    },
    trust: {
      eyebrow: "لماذا موداي",
      title: "مصمَّمة للثقة، مبنية للنساء.",
      items: [
        {
          title: "بائعات موثّقات",
          body: "تقييمات بروفايل، معدّل الرد، وشارة شراء موثّق على كل عملية.",
          icon: "badge",
        },
        {
          title: "حماية الدفع",
          body: "يُحفظ المبلغ بأمان حتى تصل القطعة وتطابق الوصف.",
          icon: "shield",
        },
        {
          title: "إرجاع مجاني",
          body: "إن لم تطابق القطعة الوصف، يمكنك طلب الإرجاع خلال ٤٨ ساعة من التسليم.",
          icon: "undo",
        },
      ],
    },
    closing: {
      title: "دوّري على حبّك القادم.",
      body: "التسوّق مجاني، العرض مجاني. بقية خزانتك بانتظارك.",
      cta: "افتحي موداي",
    },
    footer: {
      tagline: "سوق نظير-لنظير للنساء في الإمارات.",
      columns: [
        {
          heading: "التطبيق",
          links: [
            { label: "افتحي موداي", href: "/app" },
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
            { label: "عن موداي", href: "/app?view=help" },
            { label: "إرشادات المجتمع", href: "/app?view=help" },
            { label: "المساعدة", href: "/app?view=help" },
          ],
        },
        {
          heading: "قانوني",
          links: [
            { label: "الخصوصية", href: "/app?view=help" },
            { label: "الشروط", href: "/app?view=help" },
            { label: "سياسة الدفع", href: "/app?view=help" },
          ],
        },
      ],
      legal: "موداي سوق تُشغّله موداي ش.ش.م.م، الإمارات.",
      rights: "جميع الحقوق محفوظة.",
    },
  },
};
