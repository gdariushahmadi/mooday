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
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAh2_7v7zoV37aAW9Hi5RQdhdg7W1f0_a-i8ITNk6gZtxy8zVlqiUPCB8DATD3vCfeR4rxaClvsyPlwndefT1YDFkaYOMX7BZpcsoKmjYJOunliX15LXQHHYtbaaEripms5sIUvXGCCwMCrN-sc6cv7OgF0XdkcsgHpIEEKaqHgsDpckxulQ1Dp54WYKoaauruQ7ltuesUsWHOO-qCDAsdUlfD6qGmSzX2S6Z8V-2pna5pDwjgYMTRuQkCcD3PCc3Jq-jb4_CGkzXoe",
    typeEn: "Verified Collector",
    typeAr: "جامع معتمد",
  },
  noor: {
    nameEn: "Noor Label",
    nameAr: "نور ليبل",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAh2_7v7zoV37aAW9Hi5RQdhdg7W1f0_a-i8ITNk6gZtxy8zVlqiUPCB8DATD3vCfeR4rxaClvsyPlwndefT1YDFkaYOMX7BZpcsoKmjYJOunliX15LXQHHYtbaaEripms5sIUvXGCCwMCrN-sc6cv7OgF0XdkcsgHpIEEKaqHgsDpckxulQ1Dp54WYKoaauruQ7ltuesUsWHOO-qCDAsdUlfD6qGmSzX2S6Z8V-2pna5pDwjgYMTRuQkCcD3PCc3Jq-jb4_CGkzXoe",
    typeEn: "Boutique",
    typeAr: "بوتيك",
  },
  layla: {
    nameEn: "Layla's Closet",
    nameAr: "خزانة ليلى",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBvXVMd9yf_cKLCM9iTBl0hkMxU8qwGlmR5zem59BMB4KmmPqnBFhlgGAdKm4hXbMRi5WoJABe4HbXGvd5qUOM6ZDdF_v3QXh_J7RBOYPZl9bLKp3s7gEOzyEsENfrnZzBStCslQ15yhaIRsRcqDRAkriyyBE2jAXKQX-5NSo1i0jTR9DtITlHUH9Ygpo__Ov153J2Qo5j1U9G-7y_7dmLZQHKqe7ikbz2dHf0i3lX-pmK23BFOKsRXCXiniZprDQ11X91fLpDsmUBq",
    typeEn: "Verified Closet",
    typeAr: "خزانة معتمدة",
  },
  amira: {
    nameEn: "Amira Style",
    nameAr: "أميرة ستايل",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBQZtSZWn4XsDpHHHIC7z9iVX0IbUaYxUyVl1ICEAn8k8zUuouvW6tuiwtf-9Li-7TSrEJMnj5mE-eZt8oR33_4G9GALBshmvca4vaoQLYX14MRnmAUJKrYdru_ycSR2T-IeA8nUOp501ehzvK_36Nupm-SR3cb65INgc5eq_S-gyOqnqc6EzRDsfk_CM__AiuOBMINackCjRZm6V6p3umg7mvpIZuqSWRZ-jQMR7YnOz5xm17jtJ5nFMTqPu0sYjMfCrUAWwpIZvsF",
    typeEn: "Elite Seller",
    typeAr: "بائع نخبة",
  },
  hana: {
    nameEn: "Hana Luxe",
    nameAr: "هنا لوكس",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBKWjeofa4X4GCweAa4R3KVnftoPWVA-BDWhNto_qq835ynXElc_4MQ53FhyXNV-8tBxpYFG2IX2G_5tbAtqDFqa36pYG0aEEAXRL0D4x-PLX8KyjVg-sxsb9rHP_FBsvtDfTr4JEJj10zua6gpezsiVzk4gmmm_GI1fXNZYyraU7IxGz4YMn3-bzb8V1spdGW9ZetIskgQdSDdz-PpZbXWBEefwTk9OYWNxy71T716-0dN_V5DyiD1bUOnuug6ktVQLpXIlX14FugR",
    typeEn: "Luxury Reseller",
    typeAr: "بائع فاخر",
  },
  maha: {
    nameEn: "Maha Wardrobe",
    nameAr: "خزانة مها",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBvXVMd9yf_cKLCM9iTBl0hkMxU8qwGlmR5zem59BMB4KmmPqnBFhlgGAdKm4hXbMRi5WoJABe4HbXGvd5qUOM6ZDdF_v3QXh_J7RBOYPZl9bLKp3s7gEOzyEsENfrnZzBStCslQ15yhaIRsRcqDRAkriyyBE2jAXKQX-5NSo1i0jTR9DtITlHUH9Ygpo__Ov153J2Qo5j1U9G-7y_7dmLZQHKqe7ikbz2dHf0i3lX-pmK23BFOKsRXCXiniZprDQ11X91fLpDsmUBq",
    typeEn: "Verified Closet",
    typeAr: "خزانة معتمدة",
  },
  rania: {
    nameEn: "Rania Dubai",
    nameAr: "رانيا دبي",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAh2_7v7zoV37aAW9Hi5RQdhdg7W1f0_a-i8ITNk6gZtxy8zVlqiUPCB8DATD3vCfeR4rxaClvsyPlwndefT1YDFkaYOMX7BZpcsoKmjYJOunliX15LXQHHYtbaaEripms5sIUvXGCCwMCrN-sc6cv7OgF0XdkcsgHpIEEKaqHgsDpckxulQ1Dp54WYKoaauruQ7ltuesUsWHOO-qCDAsdUlfD6qGmSzX2S6Z8V-2pna5pDwjgYMTRuQkCcD3PCc3Jq-jb4_CGkzXoe",
    typeEn: "Boutique",
    typeAr: "بوتيك",
  },
  fatima: {
    nameEn: "Fatima's Edit",
    nameAr: "تحرير فاطمة",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAswBJT-tYVES_G_OKlfdBzWEIr3bUQcsem1QOyXGKZArLjPeabsBRyRjdowXxzVtUj9tL9EsqMa5bjdcXP8pQrtKe33dnWwCYndJeAKDgIrDtw1-M98s6x2SEUK8kTXPNcchZvrWMSer36Xmp0q1AoqEzXi_DENhYHBfVHtRoIYkdZ-ZngnV42eJelUwTF-v5jAvWBuBK2VxeDjGIlt6yZjIMDr_MzybK7sfBU2I-y9fFWOL85_un_f7FpY_4eB3WLB0bgY3p_Q86M",
    typeEn: "Verified Closet",
    typeAr: "خزانة معتمدة",
  },
  yasmin: {
    nameEn: "Yasmin Couture",
    nameAr: "ياسمين كوتور",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuADQHY-YfAsjkL0YDE62MipQQOGOEiBmIKI7tG9uwsM6srYY_Vm_PXtFjMEGdKG1pkcdAV09PKKoCF30mu98OVbvU8ev19Tx9krix9Po6FkLPtYJHH6CdeT3e0OqlkQPcI0itFNwzKRo-pxbXzknn8jgimOMDdwefwIHJ1vnU7NENrM_JPO5A-IR35CXWsKyoUKpHJDoOT_wmDdl8D2SGsMS7_insWu6DR0RlyRNWW8zg71BtmluXqTjTLVtVGgIMSVMwDPgGtDJNEL",
    typeEn: "Boutique",
    typeAr: "بوتيك",
  },
  dalal: {
    nameEn: "Dalal Pre-Loved",
    nameAr: "دالال بري-لوڤد",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAGJVae8kP3VS-AQjGaSG0M9l_a8AxgNQKP3ge2DdH45CoRtTaSPzq6iVV_5vkdZ6EFQPx1fMQaXaUV73kpTZyIUx1ERPrSzInPB2t0fffSSzuTfQiY4hCTB6NBT2Sw8fVr92NPwCqXcz_yY0CSpAL9y7nR8_OsWtULJoWNMFJqmWPajY-p84exDdqrchfHrAGBKy7u1R5hpwjBhUvl6DokU7LzeBgtDnPmTpbfcRyKoUZS9DCrfWRSkvluFG5Tdl_38EEFZGwQdaUt",
    typeEn: "Elite Seller",
    typeAr: "بائع نخبة",
  },
  zainab: {
    nameEn: "Zainab Collection",
    nameAr: "مجموعة زينب",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC0PlzmkgiUsm4s6YZ25dm9nfrh1VoES41f7Q18lBCqXfHCCIvGiX0Py5HRJCcuGvrfvow8V067mB1pe6Daq3nfyxaS_RFCJ6bRlRHV3TsaABu_lz3FCe8vi5W-LT_GPue1_N8GG5-BFnHhfuxl7Iq44z52xeLjBj9cD6Z-oY0OaSn08wujQwmRbv01btbABLkqWSiGKxorjnXMKanImUmxoyNpWQK1j0ValY1ocQqDad84yTDpImn9Xt1-IUQcunGMFF2Bs258B0kT",
    typeEn: "Luxury Reseller",
    typeAr: "بائع فاخر",
  },
  mariam: {
    nameEn: "Mariam Modest",
    nameAr: "مريم مودست",
    avatar:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDLhHOURRkPkOBcYhtGV1X5d-EEIWtyrO93mcenCpHyZpm3Eu0mCv-q6fO9JpUE8dKji2Vhwe_Qk-q5PycmLbSf6MW_2iZ38tMecjTakEqagD_xdbkuaqW2nXvIz1J8Vvk0hgkuZxmglrmokdm9OTrC9-ziPh5czpAsDAmUuxq_t3T6Nw1-3-J20cz3FpUuTCNQbWLyYyR9Vql2JKlTqwHVZq19KY7JacsV3OXFhAhCNft751Ya2rbFMmPurJYLa3_BB5QgO3FlPGem",
    typeEn: "Verified Closet",
    typeAr: "خزانة معتمدة",
  },
};
