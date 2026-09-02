/**
 * Legal document copy for DANEG.
 *
 * Follows the project-wide bilingual convention: one `en` / `ar` pair per
 * document, authored side by side so the two versions cannot drift.
 *
 * ⚠️ These documents are drafted against the product as built (public
 * Demo/Beta marketplace, browser-only demo receipts, user-generated
 * listings). Real payments, escrow, and seller payouts are not active.
 * They still need sign-off from a UAE-qualified lawyer before
 * launch, and every `PLACEHOLDER` value below must be replaced with the
 * real registered details — see `docs/EXTERNAL_SETUP_TODO.md`.
 */

import { BRAND, BRAND_AR } from "@/lib/brand";

/**
 * Company details that must be confirmed by the business owner before
 * these pages go live. Kept in one place so a single edit updates all
 * three documents.
 */
export const LEGAL_ENTITY = {
  nameEn: "DANEG FZ-LLC",
  nameAr: "دانق ش.ش.م.م",
  jurisdictionEn: "United Arab Emirates",
  jurisdictionAr: "الإمارات العربية المتحدة",
  addressEn: "PLACEHOLDER — registered office address",
  addressAr: "PLACEHOLDER — عنوان المكتب المسجل",
  licenceNumber: "PLACEHOLDER — trade licence number",
  supportEmail: "support@daneg.ae",
  privacyEmail: "privacy@daneg.ae",
} as const;

/** Effective date shown at the top of every document. */
export const LEGAL_EFFECTIVE_DATE = {
  en: "24 August 2026",
  ar: "٢٤ أغسطس ٢٠٢٦",
} as const;

export interface LegalSection {
  heading: string;
  /** Body paragraphs, rendered in order. */
  paragraphs?: string[];
  /** Bulleted points, rendered after the paragraphs. */
  bullets?: string[];
}

export interface LegalDocumentCopy {
  title: string;
  /** One-line summary shown under the title. */
  summary: string;
  effectiveLabel: string;
  sections: LegalSection[];
}

export interface LegalDocument {
  slug: "terms" | "privacy" | "refunds";
  en: LegalDocumentCopy;
  ar: LegalDocumentCopy;
}

// ---------------------------------------------------------------- terms

export const TERMS: LegalDocument = {
  slug: "terms",
  en: {
    title: "Terms of Service",
    summary: `The agreement between you and ${LEGAL_ENTITY.nameEn} for using ${BRAND}.`,
    effectiveLabel: "Effective",
    sections: [
      {
        heading: "1. Who we are",
        paragraphs: [
          `${BRAND} is a peer-to-peer marketplace operated by ${LEGAL_ENTITY.nameEn}, a company registered in the ${LEGAL_ENTITY.jurisdictionEn} (trade licence ${LEGAL_ENTITY.licenceNumber}), with its registered office at ${LEGAL_ENTITY.addressEn}.`,
          `In these terms, "we", "us" and "${BRAND}" mean ${LEGAL_ENTITY.nameEn}. "You" means the person using the service.`,
        ],
      },
      {
        heading: "2. Accepting these terms",
        paragraphs: [
          `By creating an account, browsing listings, buying, or selling on ${BRAND}, you agree to these terms and to our Privacy Policy and Returns & Refunds Policy.`,
          "If you do not agree, do not use the service.",
        ],
      },
      {
        heading: "3. Eligibility",
        paragraphs: [
          "You must be at least 18 years old and legally able to enter into a contract to use DANEG.",
        ],
        bullets: [
          "You must register with accurate information and keep it up to date.",
          "You are responsible for everything that happens under your account, including keeping your password and device secure.",
          "One person may not operate multiple accounts to evade suspension or manipulate the marketplace.",
        ],
      },
      {
        heading: "4. What DANEG is — and is not",
        paragraphs: [
          `${BRAND} provides the platform on which buyers and sellers deal with each other. The contract of sale for any item is between the buyer and the seller directly.`,
          "We are not the seller of items listed by users, we do not take ownership of them, and we do not warrant their authenticity, condition, legality, or fitness for any purpose, except where we expressly say otherwise for a specific service (such as an authentication service you have paid for).",
        ],
      },
      {
        heading: "5. Selling on DANEG",
        paragraphs: [
          "When you list an item you confirm that you own it, that you are entitled to sell it, and that your description and photographs are accurate and your own.",
        ],
        bullets: [
          "Counterfeit, replica, stolen, or otherwise unlawful items are strictly prohibited.",
          "Items must be described honestly, including all flaws, repairs, and signs of wear.",
          "Prohibited items include anything restricted under UAE law, hazardous goods, and any item you cannot lawfully sell.",
          "Listings are reviewed before they appear publicly. We may decline, edit, or remove any listing at our discretion.",
          "Once an item sells, you must dispatch it within the timeframe shown in the order, using a trackable method.",
        ],
      },
      {
        heading: "6. Buying on DANEG",
        paragraphs: [
          "The public Demo lets you save one listing as a Demo order. A Demo order is a browser-only receipt, is not a binding offer or sale, and does not create a shipment or payment.",
          "Do not rely on a Demo receipt as evidence of a completed purchase. Any future real checkout will be subject to separate terms shown before payment is enabled.",
        ],
      },
      {
        heading: "7. Demo payments",
        paragraphs: [
          "Real payments, escrow, card payments, Apple Pay, cash on delivery, refunds, and seller payouts are not active in the public Demo. Never enter a card number or CVV.",
          "The Demo stores only a local receipt in this browser. It does not send a financial order to the real orders table or create a payment intent. Prices are display values in UAE Dirhams (AED).",
          "Any future payment or seller payout terms will be shown before that feature is enabled.",
        ],
      },
      {
        heading: "8. Fees and taxes",
        paragraphs: [
          "You are responsible for any taxes arising from your own activity on the platform, including where selling is part of a business you operate.",
        ],
      },
      {
        heading: "9. Your content",
        paragraphs: [
          "You keep ownership of the photographs and text you upload. You grant us a non-exclusive, worldwide, royalty-free licence to host, display, resize, and promote that content for the purpose of operating and marketing the service.",
          "You must not upload content you do not have the rights to, or content that is unlawful, misleading, or infringes anyone's rights.",
        ],
      },
      {
        heading: "10. Acceptable use",
        bullets: [
          "Do not harass, threaten, defraud, or impersonate anyone.",
          "Do not take transactions off-platform to avoid fees or buyer protection.",
          "Do not scrape, reverse-engineer, overload, or attempt to gain unauthorised access to the service.",
          "Do not manipulate reviews, ratings, or search placement.",
        ],
      },
      {
        heading: "11. Moderation, suspension, and termination",
        paragraphs: [
          "We may remove listings, restrict features, suspend or close an account that breaches these terms or that we reasonably believe presents a risk to other users. Any future payout controls will apply only after real payouts are enabled.",
          "You may close your account at any time from Settings. Closing an account does not cancel obligations under orders already in progress.",
        ],
      },
      {
        heading: "12. Disputes between users",
        paragraphs: [
          "Buyers and sellers should first try to resolve issues directly through in-app chat. In the public Demo, a dispute is a status record only: no payment or escrowed funds exist. Future real-order dispute rules will be published before payments are enabled.",
        ],
      },
      {
        heading: "13. Liability",
        paragraphs: [
          "Nothing in these terms limits liability that cannot be limited by law, including for death or personal injury caused by negligence, or for fraud.",
          "Subject to that, we are not liable for the acts or omissions of other users, and our total liability to you in connection with the service is limited to the greater of the fees you paid us in the twelve months before the claim, or AED 500.",
          "The service is provided on an \"as is\" basis. We do not guarantee uninterrupted or error-free operation.",
        ],
      },
      {
        heading: "14. Changes to these terms",
        paragraphs: [
          "We may update these terms. If a change materially affects your rights we will notify you in the app or by email before it takes effect. Continuing to use the service after that date means you accept the updated terms.",
        ],
      },
      {
        heading: "15. Governing law",
        paragraphs: [
          `These terms are governed by the laws of the ${LEGAL_ENTITY.jurisdictionEn}, and the courts of the ${LEGAL_ENTITY.jurisdictionEn} have exclusive jurisdiction over any dispute arising from them.`,
        ],
      },
      {
        heading: "16. Contact",
        paragraphs: [
          `Questions about these terms: ${LEGAL_ENTITY.supportEmail}.`,
        ],
      },
    ],
  },
  ar: {
    title: "شروط الخدمة",
    summary: `الاتفاقية بينك وبين ${LEGAL_ENTITY.nameAr} لاستخدام ${BRAND_AR}.`,
    effectiveLabel: "سارية من",
    sections: [
      {
        heading: "١. من نحن",
        paragraphs: [
          `${BRAND_AR} سوق إلكتروني بين الأفراد تُشغّله ${LEGAL_ENTITY.nameAr}، وهي شركة مسجّلة في ${LEGAL_ENTITY.jurisdictionAr} (رخصة تجارية ${LEGAL_ENTITY.licenceNumber})، ومقرها المسجّل في ${LEGAL_ENTITY.addressAr}.`,
          `في هذه الشروط، تعني كلمة "نحن" و"${BRAND_AR}" شركة ${LEGAL_ENTITY.nameAr}، وتعني كلمة "أنتِ" الشخص الذي يستخدم الخدمة.`,
        ],
      },
      {
        heading: "٢. قبول الشروط",
        paragraphs: [
          `بإنشاء حساب أو تصفّح القوائم أو الشراء أو البيع على ${BRAND_AR}، فإنكِ توافقين على هذه الشروط وعلى سياسة الخصوصية وسياسة الإرجاع والاسترداد.`,
          "إذا كنتِ لا توافقين، فلا تستخدمي الخدمة.",
        ],
      },
      {
        heading: "٣. الأهلية",
        paragraphs: [
          "يجب أن يكون عمرك ١٨ عاماً على الأقل وأن تكوني مؤهلة قانوناً لإبرام العقود لاستخدام دانق.",
        ],
        bullets: [
          "يجب التسجيل بمعلومات صحيحة والحفاظ على تحديثها.",
          "أنتِ مسؤولة عن كل ما يحدث عبر حسابك، بما في ذلك حماية كلمة المرور والجهاز.",
          "لا يجوز لشخص واحد تشغيل حسابات متعددة للتحايل على الإيقاف أو التلاعب بالسوق.",
        ],
      },
      {
        heading: "٤. ما هي دانق وما ليست",
        paragraphs: [
          `توفّر ${BRAND_AR} المنصة التي يتعامل عبرها المشترون والبائعون فيما بينهم. وعقد البيع لأي قطعة يكون بين المشتري والبائع مباشرةً.`,
          "لسنا بائعي القطع المعروضة من المستخدمين، ولا نملكها، ولا نضمن أصالتها أو حالتها أو قانونيتها أو ملاءمتها لأي غرض، إلا حين ننص صراحةً على خلاف ذلك لخدمة محددة (مثل خدمة توثيق دفعتِ مقابلها).",
        ],
      },
      {
        heading: "٥. البيع على دانق",
        paragraphs: [
          "عند عرض قطعة فإنكِ تؤكدين أنكِ تملكينها وأنه يحق لكِ بيعها وأن الوصف والصور دقيقة وخاصة بكِ.",
        ],
        bullets: [
          "يُمنع منعاً باتاً عرض القطع المقلّدة أو المسروقة أو غير القانونية.",
          "يجب وصف القطع بأمانة، بما في ذلك كل العيوب والإصلاحات وعلامات الاستخدام.",
          "تشمل القطع الممنوعة كل ما هو مقيّد بموجب قانون الإمارات والمواد الخطرة وأي قطعة لا يحق لكِ بيعها.",
          "تُراجَع القوائم قبل ظهورها للعامة، ويحق لنا رفض أو تعديل أو إزالة أي قائمة وفق تقديرنا.",
          "بعد بيع القطعة، يجب شحنها خلال المدة الموضحة في الطلب وبوسيلة قابلة للتتبّع.",
        ],
      },
      {
        heading: "٦. الشراء على دانق",
        paragraphs: [
          "تتيح النسخة التجريبية العامة حفظ قائمة واحدة كطلب تجريبي. وإيصال الطلب التجريبي محفوظ في هذا المتصفح فقط، وليس عرضاً ملزماً أو عملية بيع، ولا ينشئ شحناً أو دفعاً.",
          "لا تعتمدي على الإيصال التجريبي كدليل على شراء مكتمل. وسيخضع أي دفع حقيقي مستقبلاً لشروط منفصلة تظهر قبل تفعيل الدفع.",
        ],
      },
      {
        heading: "٧. الدفع التجريبي",
        paragraphs: [
          "المدفوعات الحقيقية والضمان والدفع بالبطاقة وآبل باي والدفع عند الاستلام والاسترداد وتحويل أرباح البائعات غير مفعّلة في النسخة التجريبية العامة. لا تدخلي رقم البطاقة أو CVV.",
          "تخزّن النسخة التجريبية إيصالاً محلياً في هذا المتصفح فقط. ولا ترسل طلباً مالياً إلى جدول الطلبات الحقيقي ولا تنشئ Payment Intent. الأسعار للعرض فقط وبالدرهم الإماراتي.",
          "ستظهر شروط أي دفع أو تحويل أرباح مستقبلي قبل تفعيل الميزة.",
        ],
      },
      {
        heading: "٨. الرسوم والضرائب",
        paragraphs: [
          "أنتِ مسؤولة عن أي ضرائب تنشأ عن نشاطك على المنصة، بما في ذلك إن كان البيع جزءاً من عمل تجاري تديرينه.",
        ],
      },
      {
        heading: "٩. المحتوى الخاص بكِ",
        paragraphs: [
          "تبقى ملكية الصور والنصوص التي ترفعينها لكِ. وتمنحيننا ترخيصاً غير حصري وعالمياً وبدون مقابل لاستضافة هذا المحتوى وعرضه وتغيير مقاسه والترويج به لغرض تشغيل الخدمة وتسويقها.",
          "يُمنع رفع محتوى لا تملكين حقوقه أو محتوى غير قانوني أو مضلل أو ينتهك حقوق الآخرين.",
        ],
      },
      {
        heading: "١٠. الاستخدام المقبول",
        bullets: [
          "لا تتحرشي بأحد ولا تهدديه ولا تحتالي عليه ولا تنتحلي صفته.",
          "لا تنقلي المعاملات خارج المنصة لتفادي الرسوم أو حماية المشتري.",
          "لا تقومي بكشط البيانات أو الهندسة العكسية أو إثقال الخدمة أو محاولة الوصول غير المصرّح به.",
          "لا تتلاعبي بالتقييمات أو المراجعات أو ترتيب نتائج البحث.",
        ],
      },
      {
        heading: "١١. الإشراف والإيقاف والإنهاء",
        paragraphs: [
          "يحق لنا إزالة القوائم أو تقييد الميزات أو إيقاف الحساب أو إغلاقه عند مخالفة هذه الشروط أو عندما نعتقد بشكل معقول أنه يشكّل خطراً على المستخدمين الآخرين. وتُطبَّق أي ضوابط مستقبلية للتحويلات فقط بعد تفعيل التحويلات الحقيقية.",
          "يمكنكِ إغلاق حسابك في أي وقت من الإعدادات. ولا يُلغي إغلاق الحساب الالتزامات المترتبة على طلبات جارية.",
        ],
      },
      {
        heading: "١٢. النزاعات بين المستخدمين",
        paragraphs: [
          "على المشترين والبائعين محاولة حل المشكلات مباشرةً عبر المحادثة داخل التطبيق أولاً. وفي النسخة التجريبية العامة، يسجّل النزاع الحالة فقط، ولا يوجد دفع أو مبلغ ضمان. وستُنشر قواعد النزاعات للطلبات الحقيقية مستقبلاً قبل تفعيل الدفع.",
        ],
      },
      {
        heading: "١٣. المسؤولية",
        paragraphs: [
          "لا يحدّ أي بند في هذه الشروط من المسؤولية التي لا يجوز تحديدها قانوناً، بما في ذلك الوفاة أو الإصابة الشخصية الناتجة عن الإهمال أو الاحتيال.",
          "ومع مراعاة ذلك، لسنا مسؤولين عن أفعال المستخدمين الآخرين أو تقصيرهم، وتقتصر مسؤوليتنا الإجمالية تجاهك على الأكبر من: الرسوم التي دفعتِها لنا خلال الاثني عشر شهراً السابقة للمطالبة، أو ٥٠٠ درهم إماراتي.",
          "تُقدَّم الخدمة «كما هي»، ولا نضمن تشغيلها دون انقطاع أو أخطاء.",
        ],
      },
      {
        heading: "١٤. تعديل الشروط",
        paragraphs: [
          "قد نُحدّث هذه الشروط. وإذا أثّر التغيير جوهرياً على حقوقك فسنُخطرك داخل التطبيق أو بالبريد الإلكتروني قبل سريانه. ويعني استمرارك في استخدام الخدمة بعد ذلك التاريخ قبولك للشروط المحدّثة.",
        ],
      },
      {
        heading: "١٥. القانون الواجب التطبيق",
        paragraphs: [
          `تخضع هذه الشروط لقوانين ${LEGAL_ENTITY.jurisdictionAr}، وتختص محاكم ${LEGAL_ENTITY.jurisdictionAr} حصرياً بأي نزاع ينشأ عنها.`,
        ],
      },
      {
        heading: "١٦. التواصل",
        paragraphs: [
          `للاستفسار عن هذه الشروط: ${LEGAL_ENTITY.supportEmail}.`,
        ],
      },
    ],
  },
};

// -------------------------------------------------------------- privacy

export const PRIVACY: LegalDocument = {
  slug: "privacy",
  en: {
    title: "Privacy Policy",
    summary: `How ${LEGAL_ENTITY.nameEn} collects, uses, and protects your personal data.`,
    effectiveLabel: "Effective",
    sections: [
      {
        heading: "1. Controller",
        paragraphs: [
          `${LEGAL_ENTITY.nameEn}, ${LEGAL_ENTITY.addressEn}, ${LEGAL_ENTITY.jurisdictionEn}, is the controller of the personal data described here. Contact us at ${LEGAL_ENTITY.privacyEmail}.`,
          "This policy is written to meet UAE Federal Decree-Law No. 45 of 2021 on the Protection of Personal Data.",
        ],
      },
      {
        heading: "2. What we collect",
        bullets: [
          "Account data — name, email address, phone number, password hash, and profile photo.",
          "Profile and listing content — bio, location, item photographs, descriptions, and prices you publish.",
          "Demo data — browser-only Demo receipts, selected delivery addresses, and sample order status. We do not request or store card numbers, CVV, saved card details, or payout data in the public Demo.",
          "Communications — in-app chat messages, reviews, reports, disputes, and support correspondence.",
          "Technical data — IP address, device and browser type, and app interaction logs used for security and diagnostics.",
        ],
      },
      {
        heading: "3. Why we use it",
        bullets: [
          "To create and operate your account and show you the marketplace.",
          "To save Demo receipts in your browser, show the marketplace, and support future product testing. Real payments, escrow, seller payouts, and refunds are not active.",
          "To detect fraud, counterfeits, and abuse, and to enforce our terms.",
          "To provide support and resolve disputes.",
          "To send service messages about your orders and account. Marketing messages are sent only with your consent and you can withdraw it at any time.",
          "To improve the product using aggregated and diagnostic information.",
        ],
      },
      {
        heading: "4. Legal basis",
        paragraphs: [
          "We process your data to perform our contract with you, to comply with legal obligations, for our legitimate interests in running a safe marketplace, and — where required — on the basis of your consent.",
        ],
      },
      {
        heading: "5. Who we share it with",
        bullets: [
          "Other users — a seller sees a buyer's delivery details for a confirmed order, and public profile information is visible to anyone using the app.",
          "Payment provider — only if a future payment feature is enabled and you receive a new notice.",
          "Infrastructure and hosting providers — to store data and run the service.",
          "Error monitoring — anonymised diagnostic data. Tokens, passwords, and one-time codes are redacted.",
          "Authorities — where we are legally required to disclose, or to protect the rights and safety of users.",
        ],
        paragraphs: ["We do not sell your personal data."],
      },
      {
        heading: "6. International transfers",
        paragraphs: [
          "Some of our providers process data outside the UAE. Where that happens we rely on providers that offer an adequate level of protection and contractual safeguards.",
        ],
      },
      {
        heading: "7. How long we keep it",
        paragraphs: [
          "Account data is kept while your account is open. After you close it we delete or anonymise your data, except records we must keep for legal, tax, accounting, fraud-prevention, or dispute-resolution purposes — typically for up to seven years for transaction records.",
        ],
      },
      {
        heading: "8. Your rights",
        bullets: [
          "Access a copy of the personal data we hold about you.",
          "Correct data that is inaccurate or incomplete.",
          "Request deletion of your data, subject to our retention obligations.",
          "Object to or restrict certain processing, and withdraw consent for marketing.",
          "Request your data in a portable format.",
          "Complain to the UAE Data Office if you believe we have handled your data improperly.",
        ],
        paragraphs: [
          `To exercise any of these rights, email ${LEGAL_ENTITY.privacyEmail}. We respond within 30 days.`,
        ],
      },
      {
        heading: "9. Security",
        paragraphs: [
          "Data is encrypted in transit. Access to production data is restricted to staff who need it, and database access rules isolate each user's private records. No system is perfectly secure, so please use a strong, unique password and enable the in-app lock.",
        ],
      },
      {
        heading: "10. Children",
        paragraphs: [
          `${BRAND} is not intended for anyone under 18. We do not knowingly collect data from children. If you believe a child has given us data, contact ${LEGAL_ENTITY.privacyEmail} and we will delete it.`,
        ],
      },
      {
        heading: "11. Cookies and local storage",
        paragraphs: [
          "We use local storage and similar technologies to keep you signed in, remember your language and theme, and keep the app usable offline. We do not use third-party advertising trackers.",
        ],
      },
      {
        heading: "12. Changes",
        paragraphs: [
          "We will post any update here and, for material changes, notify you in the app or by email before it takes effect.",
        ],
      },
    ],
  },
  ar: {
    title: "سياسة الخصوصية",
    summary: `كيف تجمع ${LEGAL_ENTITY.nameAr} بياناتك الشخصية وتستخدمها وتحميها.`,
    effectiveLabel: "سارية من",
    sections: [
      {
        heading: "١. المتحكّم بالبيانات",
        paragraphs: [
          `${LEGAL_ENTITY.nameAr}، ${LEGAL_ENTITY.addressAr}، ${LEGAL_ENTITY.jurisdictionAr}، هي المتحكّم بالبيانات الشخصية الموضحة هنا. للتواصل: ${LEGAL_ENTITY.privacyEmail}.`,
          "أُعدّت هذه السياسة بما يتوافق مع المرسوم بقانون اتحادي رقم ٤٥ لسنة ٢٠٢١ بشأن حماية البيانات الشخصية.",
        ],
      },
      {
        heading: "٢. ما الذي نجمعه",
        bullets: [
          "بيانات الحساب — الاسم والبريد الإلكتروني ورقم الهاتف وبصمة كلمة المرور وصورة الملف الشخصي.",
          "محتوى الملف والقوائم — النبذة والموقع وصور القطع وأوصافها وأسعارها.",
          "بيانات تجريبية — إيصالات الطلبات المحفوظة في هذا المتصفح وعناوين التوصيل المختارة وحالة الطلب التجريبية. لا نطلب أو نخزّن أرقام البطاقات أو CVV أو بيانات البطاقات المحفوظة أو بيانات التحويل في النسخة العامة.",
          "المراسلات — رسائل المحادثة والمراجعات والبلاغات والنزاعات ومراسلات الدعم.",
          "البيانات التقنية — عنوان IP ونوع الجهاز والمتصفح وسجلات التفاعل المستخدمة للأمان والتشخيص.",
        ],
      },
      {
        heading: "٣. لماذا نستخدمها",
        bullets: [
          "لإنشاء حسابك وتشغيله وعرض السوق لكِ.",
          "لحفظ الإيصالات التجريبية في متصفحك وعرض السوق ودعم اختبار المنتج مستقبلاً. المدفوعات الحقيقية والضمان وتحويل أرباح البائعات والاسترداد غير مفعّلة.",
          "لكشف الاحتيال والتقليد وإساءة الاستخدام ولتطبيق شروطنا.",
          "لتقديم الدعم وحل النزاعات.",
          "لإرسال رسائل الخدمة المتعلقة بطلباتك وحسابك. أما الرسائل التسويقية فتُرسل بموافقتك فقط ويمكنك سحبها في أي وقت.",
          "لتحسين المنتج باستخدام معلومات مجمّعة وتشخيصية.",
        ],
      },
      {
        heading: "٤. الأساس القانوني",
        paragraphs: [
          "نعالج بياناتك لتنفيذ عقدنا معكِ، وللامتثال للالتزامات القانونية، ولمصالحنا المشروعة في تشغيل سوق آمن، وعلى أساس موافقتك حيثما لزم ذلك.",
        ],
      },
      {
        heading: "٥. مع من نشاركها",
        bullets: [
          "المستخدمون الآخرون — يرى البائع بيانات توصيل المشتري لطلب مؤكّد، ومعلومات الملف العام مرئية لأي مستخدم للتطبيق.",
          "مزوّد الدفع — فقط إذا فُعّلت ميزة دفع مستقبلية ووصلتكِ ملاحظة جديدة.",
          "مزوّدو البنية التحتية والاستضافة — لتخزين البيانات وتشغيل الخدمة.",
          "مراقبة الأخطاء — بيانات تشخيصية مجهولة الهوية، مع حجب الرموز وكلمات المرور ورموز التحقق.",
          "الجهات الرسمية — حين يُلزمنا القانون بالإفصاح أو لحماية حقوق المستخدمين وسلامتهم.",
        ],
        paragraphs: ["نحن لا نبيع بياناتك الشخصية."],
      },
      {
        heading: "٦. النقل الدولي",
        paragraphs: [
          "يعالج بعض مزوّدينا البيانات خارج الإمارات. وفي هذه الحالة نعتمد على مزوّدين يوفّرون مستوى حماية كافياً وضمانات تعاقدية.",
        ],
      },
      {
        heading: "٧. مدة الاحتفاظ",
        paragraphs: [
          "نحتفظ ببيانات الحساب طوال فترة فتحه. وبعد إغلاقه نحذف بياناتك أو نجعلها مجهولة الهوية، باستثناء السجلات التي يلزمنا الاحتفاظ بها لأغراض قانونية أو ضريبية أو محاسبية أو لمنع الاحتيال أو لحل النزاعات — وعادةً حتى سبع سنوات لسجلات المعاملات.",
        ],
      },
      {
        heading: "٨. حقوقك",
        bullets: [
          "الاطلاع على نسخة من بياناتك الشخصية لدينا.",
          "تصحيح البيانات غير الدقيقة أو الناقصة.",
          "طلب حذف بياناتك، مع مراعاة التزامات الاحتفاظ لدينا.",
          "الاعتراض على معالجة معيّنة أو تقييدها، وسحب الموافقة على التسويق.",
          "طلب بياناتك بصيغة قابلة للنقل.",
          "تقديم شكوى إلى مكتب البيانات في الإمارات إن رأيتِ أننا تعاملنا مع بياناتك بشكل غير سليم.",
        ],
        paragraphs: [
          `لممارسة أي من هذه الحقوق راسلينا على ${LEGAL_ENTITY.privacyEmail}، ونردّ خلال ٣٠ يوماً.`,
        ],
      },
      {
        heading: "٩. الأمان",
        paragraphs: [
          "تُشفَّر البيانات أثناء النقل، والوصول إلى بيانات الإنتاج مقصور على الموظفين الذين يحتاجونه، وقواعد الوصول إلى قاعدة البيانات تعزل السجلات الخاصة بكل مستخدم. ولا يوجد نظام آمن تماماً، لذا استخدمي كلمة مرور قوية وفريدة وفعّلي قفل التطبيق.",
        ],
      },
      {
        heading: "١٠. الأطفال",
        paragraphs: [
          `${BRAND_AR} غير مخصّصة لمن هم دون ١٨ عاماً، ولا نجمع بيانات الأطفال عن علم. وإن اعتقدتِ أن طفلاً زوّدنا ببياناته فراسلينا على ${LEGAL_ENTITY.privacyEmail} وسنحذفها.`,
        ],
      },
      {
        heading: "١١. ملفات التتبّع والتخزين المحلي",
        paragraphs: [
          "نستخدم التخزين المحلي وتقنيات مشابهة لإبقائك مسجّلة الدخول وتذكّر لغتك ومظهرك وإتاحة استخدام التطبيق دون اتصال. ولا نستخدم أدوات تتبّع إعلانية من أطراف ثالثة.",
        ],
      },
      {
        heading: "١٢. التعديلات",
        paragraphs: [
          "سننشر أي تحديث هنا، وسنُخطرك داخل التطبيق أو بالبريد الإلكتروني قبل سريان التغييرات الجوهرية.",
        ],
      },
    ],
  },
};

// -------------------------------------------------------------- refunds

export const REFUNDS: LegalDocument = {
  slug: "refunds",
  en: {
    title: "Returns & Refunds Policy",
    summary: "What Demo returns and future real-order refunds mean on DANEG.",
    effectiveLabel: "Effective",
    sections: [
      {
        heading: "1. Public Demo boundary",
        paragraphs: [
          "The public Demo does not take payment, hold money, create a shipment, or pay a seller. A Demo order and a return request are browser-only records for product testing.",
        ],
      },
      {
        heading: "2. Demo receipts",
        paragraphs: [
          "Saving a Demo order creates a receipt with a Demo identifier. No card number or CVV is requested or stored. The receipt does not confirm a purchase or create a right to delivery.",
        ],
      },
      {
        heading: "3. Future returns",
        paragraphs: [
          "When real checkout is enabled, DANEG will publish the return conditions, inspection period, evidence rules, and refund method before payment. The current Demo does not provide a real return or refund.",
        ],
      },
      {
        heading: "4. What is not available",
        bullets: [
          "Card payments, Apple Pay, cash on delivery, escrow, seller payouts, and refunds.",
          "Delivery, courier claims, inspection windows, and binding purchase protection.",
          "A promise that a Demo return request will cause money to be returned.",
        ],
      },
      {
        heading: "5. Demo feedback",
        paragraphs: [
          "You may submit a Demo return request with a reason, description, and real evidence photos. This helps test the flow. The photos stay in the browser session and are not evidence of a real transaction.",
        ],
      },
      {
        heading: "6. Future disputes",
        paragraphs: [
          "The Demo dispute screen shows status handling only. Future real-order dispute rules and response times will be published before payments are enabled.",
        ],
      },
      {
        heading: "7. Future return shipping",
        paragraphs: [
          "No return shipment is created by the public Demo. Any future responsibility for return shipping will be shown with the real checkout and return instructions.",
        ],
      },
      {
        heading: "8. Future refunds",
        paragraphs: [
          "The public Demo processes no refund because it takes no payment. No refund timing or method applies to a Demo order.",
        ],
      },
      {
        heading: "9. Demo cancellation",
        paragraphs: [
          "You may remove a local Demo receipt from your browser data. This does not cancel a real purchase because the public Demo creates none.",
        ],
      },
      {
        heading: "10. Future seller payouts",
        paragraphs: [
          "Seller payouts and commissions are not active. Future payout rules will be documented and enabled separately from this public Demo.",
        ],
      },
      {
        heading: "11. Contact",
        paragraphs: [
          `Need help with a return? ${LEGAL_ENTITY.supportEmail}.`,
        ],
      },
    ],
  },
  ar: {
    title: "سياسة الإرجاع والاسترداد",
    summary: "ما يعنيه الإرجاع التجريبي والاسترداد المستقبلي للطلبات الحقيقية على دانق.",
    effectiveLabel: "سارية من",
    sections: [
      {
        heading: "١. حدود النسخة التجريبية العامة",
        paragraphs: [
          "لا تستلم النسخة التجريبية العامة أي دفع، ولا تحتفظ بأي مبلغ، ولا تنشئ شحنة، ولا تحوّل أرباحاً للبائعة. الطلب التجريبي وطلب الإرجاع سجلات محفوظة في المتصفح لاختبار المنتج.",
        ],
      },
      {
        heading: "٢. الإيصالات التجريبية",
        paragraphs: [
          "يؤدي حفظ الطلب التجريبي إلى إنشاء إيصال بمعرّف تجريبي. لا يُطلب رقم البطاقة أو CVV ولا يُخزَّن. ولا يؤكد الإيصال شراءً ولا ينشئ حقاً في التوصيل.",
        ],
      },
      {
        heading: "٣. الإرجاع مستقبلاً",
        paragraphs: [
          "عند تفعيل الدفع الحقيقي، ستنشر دانق شروط الإرجاع وفترة الفحص وقواعد الأدلة وطريقة الاسترداد قبل الدفع. ولا يوفّر الإصدار التجريبي الحالي إرجاعاً أو استرداداً حقيقياً.",
        ],
      },
      {
        heading: "٤. ما هو غير متاح",
        bullets: [
          "الدفع بالبطاقة وآبل باي والدفع عند الاستلام والضمان وتحويل أرباح البائعات والاسترداد.",
          "التوصيل ومطالبات الشحن وفترات الفحص وحماية الشراء الملزم.",
          "أي وعد بأن طلب الإرجاع التجريبي سيؤدي إلى إعادة مبلغ.",
        ],
      },
      {
        heading: "٥. الملاحظات التجريبية",
        paragraphs: [
          "يمكنكِ إرسال طلب إرجاع تجريبي مع السبب والوصف وصور حقيقية للأدلة. يساعد ذلك في اختبار المسار. تبقى الصور في جلسة المتصفح ولا تُعد دليلاً على معاملة حقيقية.",
        ],
      },
      {
        heading: "٦. النزاعات مستقبلاً",
        paragraphs: [
          "تعرض شاشة النزاع التجريبية معالجة الحالة فقط. وستُنشر قواعد النزاعات للطلبات الحقيقية وأوقات الرد قبل تفعيل الدفع.",
        ],
      },
      {
        heading: "٧. شحن الإرجاع مستقبلاً",
        paragraphs: [
          "لا تنشئ النسخة التجريبية العامة أي شحنة إرجاع. وستظهر مسؤولية شحن الإرجاع مستقبلاً مع تعليمات الدفع والإرجاع الحقيقية.",
        ],
      },
      {
        heading: "٨. الاسترداد مستقبلاً",
        paragraphs: [
          "لا تعالج النسخة التجريبية العامة أي استرداد لأنها لا تستلم أي دفع. ولا ينطبق توقيت أو أسلوب استرداد على الطلب التجريبي.",
        ],
      },
      {
        heading: "٩. إلغاء الطلب التجريبي",
        paragraphs: [
          "يمكنكِ حذف إيصال تجريبي محلي من بيانات المتصفح. ولا يلغي ذلك عملية شراء حقيقية لأن النسخة التجريبية العامة لا تنشئ عملية شراء.",
        ],
      },
      {
        heading: "١٠. تحويل أرباح البائعات مستقبلاً",
        paragraphs: [
          "تحويل أرباح البائعات والعمولات غير مفعّل. وستوثّق قواعد التحويل المستقبلية وتُفعّل بشكل منفصل عن هذه النسخة التجريبية العامة.",
        ],
      },
      {
        heading: "١١. التواصل",
        paragraphs: [
          `تحتاجين مساعدة بشأن إرجاع؟ ${LEGAL_ENTITY.supportEmail}.`,
        ],
      },
    ],
  },
};

export const LEGAL_DOCUMENTS = [TERMS, PRIVACY, REFUNDS] as const;
