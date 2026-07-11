export interface SellerProfile {
  nameEn: string;
  nameAr: string;
  avatar: string;
  typeEn: string;
  typeAr: string;
}

export const SELLERS: Record<string, SellerProfile> = {
  sarah: {
    nameEn: "Sarah's Vintage",
    nameAr: "عتيق سارة",
    avatar: "/sellers/sarah.jpg",
    typeEn: "Verified Collector",
    typeAr: "جامع معتمد",
  },
  noor: {
    nameEn: "Noor Label",
    nameAr: "نور ليبل",
    avatar: "/sellers/noor.jpg",
    typeEn: "Boutique",
    typeAr: "بوتيك",
  },
  layla: {
    nameEn: "Layla's Closet",
    nameAr: "خزانة ليلى",
    avatar: "/sellers/layla.jpg",
    typeEn: "Verified Closet",
    typeAr: "خزانة معتمدة",
  },
  amira: {
    nameEn: "Amira Style",
    nameAr: "أميرة ستايل",
    avatar: "/sellers/amira.jpg",
    typeEn: "Elite Seller",
    typeAr: "بائع نخبة",
  },
  hana: {
    nameEn: "Hana Luxe",
    nameAr: "هنا لوكس",
    avatar: "/sellers/hana.jpg",
    typeEn: "Luxury Reseller",
    typeAr: "بائع فاخر",
  },
  maha: {
    nameEn: "Maha Wardrobe",
    nameAr: "خزانة مها",
    avatar: "/sellers/maha.jpg",
    typeEn: "Verified Closet",
    typeAr: "خزانة معتمدة",
  },
  rania: {
    nameEn: "Rania Dubai",
    nameAr: "رانيا دبي",
    avatar: "/sellers/rania.jpg",
    typeEn: "Boutique",
    typeAr: "بوتيك",
  },
  fatima: {
    nameEn: "Fatima's Edit",
    nameAr: "تحرير فاطمة",
    avatar: "/sellers/fatima.jpg",
    typeEn: "Verified Closet",
    typeAr: "خزانة معتمدة",
  },
  yasmin: {
    nameEn: "Yasmin Couture",
    nameAr: "ياسمين كوتور",
    avatar: "/sellers/yasmin.jpg",
    typeEn: "Boutique",
    typeAr: "بوتيك",
  },
  dalal: {
    nameEn: "Dalal Pre-Loved",
    nameAr: "دالال بري-لوڤد",
    avatar: "/sellers/dalal.jpg",
    typeEn: "Elite Seller",
    typeAr: "بائع نخبة",
  },
  zainab: {
    nameEn: "Zainab Collection",
    nameAr: "مجموعة زينب",
    avatar: "/sellers/zainab.jpg",
    typeEn: "Luxury Reseller",
    typeAr: "بائع فاخر",
  },
  mariam: {
    nameEn: "Mariam Modest",
    nameAr: "مريم مودست",
    avatar: "/sellers/mariam.jpg",
    typeEn: "Verified Closet",
    typeAr: "خزانة معتمدة",
  },
};
