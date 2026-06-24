"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { defaultProducts, SEED_VERSION } from "@/data/products";

export interface Product {
  id: string;
  titleEn: string;
  titleAr: string;
  price: number;
  originalPrice: number;
  conditionEn: string;
  conditionAr: string;
  sellerNameEn: string;
  sellerNameAr: string;
  sellerAvatar: string;
  sellerTypeEn: string;
  sellerTypeAr: string;
  saves: number;
  image: string;
  images: string[];
  descriptionEn: string;
  descriptionAr: string;
  category: string;
  isAuthentic?: boolean;
}

export interface ChatMessage {
  id: string;
  sender: "user" | "seller";
  text: string;
  time: string;
}

export interface ChatThread {
  id: string;
  sellerName: string;
  sellerAvatar: string;
  productTitle: string;
  productImage: string;
  lastMessage: string;
  lastMessageTime: string;
  messages: ChatMessage[];
}

export interface CartItem {
  product: Product;
  quantity: number;
}

interface AppContextType {
  language: "en" | "ar";
  setLanguage: (lang: "en" | "ar") => void;
  listings: Product[];
  addListing: (product: Omit<Product, "id" | "saves">) => void;
  likes: string[];
  toggleLike: (productId: string) => void;
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  chats: ChatThread[];
  sendChatMessage: (threadId: string, text: string) => void;
  createChatThread: (product: Product) => string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<"en" | "ar">("en");
  const [listings, setListings] = useState<Product[]>(defaultProducts);
  const [likes, setLikes] = useState<string[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [chats, setChats] = useState<ChatThread[]>([]);

  // Load from LocalStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem("mooday_lang") as "en" | "ar";
    if (savedLanguage) {
      setLanguageState(savedLanguage);
      document.documentElement.dir = savedLanguage === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = savedLanguage;
    }

    const savedLikes = localStorage.getItem("mooday_likes");
    if (savedLikes) setLikes(JSON.parse(savedLikes));

    const savedCart = localStorage.getItem("mooday_cart");
    if (savedCart) setCart(JSON.parse(savedCart));

    const savedSeedVersion = localStorage.getItem("mooday_seed_version");
    const savedListings = localStorage.getItem("mooday_listings");
    if (savedSeedVersion !== SEED_VERSION) {
      localStorage.setItem("mooday_seed_version", SEED_VERSION);
      localStorage.setItem("mooday_listings", JSON.stringify(defaultProducts));
      setListings(defaultProducts);
    } else if (savedListings) {
      setListings(JSON.parse(savedListings));
    }

    const savedChats = localStorage.getItem("mooday_chats");
    if (savedChats) {
      setChats(JSON.parse(savedChats));
    } else {
      // Setup a default demo chat thread
      const initialThread: ChatThread = {
        id: "chat-handbag-tan",
        sellerName: "Sarah's Vintage",
        sellerAvatar: defaultProducts[0].sellerAvatar,
        productTitle: "Vintage Classic Handbag in Tan Leather",
        productImage: defaultProducts[0].image,
        lastMessage: "Let me know if you would like to make an offer!",
        lastMessageTime: "Yesterday",
        messages: [
          { id: "1", sender: "user", text: "Hi, is this handbag still available?", time: "Yesterday, 3:45 PM" },
          { id: "2", sender: "seller", text: "Hi there! Yes, it is still available. It's in excellent condition.", time: "Yesterday, 3:50 PM" },
          { id: "3", sender: "seller", text: "Let me know if you would like to make an offer!", time: "Yesterday, 3:51 PM" }
        ]
      };
      setChats([initialThread]);
    }
  }, []);

  const setLanguage = (lang: "en" | "ar") => {
    setLanguageState(lang);
    localStorage.setItem("mooday_lang", lang);
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  };

  const addListing = (product: Omit<Product, "id" | "saves">) => {
    const newProduct: Product = {
      ...product,
      id: `custom-${Date.now()}`,
      saves: 0
    };
    const updated = [newProduct, ...listings];
    setListings(updated);
    localStorage.setItem("mooday_listings", JSON.stringify(updated));
  };

  const toggleLike = (productId: string) => {
    let updatedLikes: string[];
    if (likes.includes(productId)) {
      updatedLikes = likes.filter(id => id !== productId);
    } else {
      updatedLikes = [...likes, productId];
    }
    setLikes(updatedLikes);
    localStorage.setItem("mooday_likes", JSON.stringify(updatedLikes));
  };

  const addToCart = (product: Product) => {
    let updatedCart = [...cart];
    const existingIndex = updatedCart.findIndex(item => item.product.id === product.id);

    if (existingIndex > -1) {
      updatedCart[existingIndex].quantity += 1;
    } else {
      updatedCart.push({ product, quantity: 1 });
    }
    setCart(updatedCart);
    localStorage.setItem("mooday_cart", JSON.stringify(updatedCart));
  };

  const removeFromCart = (productId: string) => {
    const updatedCart = cart.filter(item => item.product.id !== productId);
    setCart(updatedCart);
    localStorage.setItem("mooday_cart", JSON.stringify(updatedCart));
  };

  const clearCart = () => {
    setCart([]);
    localStorage.setItem("mooday_cart", JSON.stringify([]));
  };

  const createChatThread = (product: Product): string => {
    const threadId = `chat-${product.id}`;
    const existing = chats.find(c => c.id === threadId);
    if (existing) return threadId;

    const newThread: ChatThread = {
      id: threadId,
      sellerName: language === "ar" ? product.sellerNameAr : product.sellerNameEn,
      sellerAvatar: product.sellerAvatar,
      productTitle: language === "ar" ? product.titleAr : product.titleEn,
      productImage: product.image,
      lastMessage: language === "ar" ? "مرحباً! كيف يمكنني مساعدتك؟" : "Hi! How can I help you?",
      lastMessageTime: "Just now",
      messages: [
        {
          id: "1",
          sender: "seller",
          text: language === "ar" 
            ? `مرحباً! أنا سعيد باهتمامك بـ "${product.titleAr}". كيف يمكنني مساعدتك؟`
            : `Hi there! Glad you're interested in my "${product.titleEn}". How can I help you today?`,
          time: "Just now"
        }
      ]
    };

    const updated = [newThread, ...chats];
    setChats(updated);
    localStorage.setItem("mooday_chats", JSON.stringify(updated));
    return threadId;
  };

  const sendChatMessage = (threadId: string, text: string) => {
    const threadIndex = chats.findIndex(c => c.id === threadId);
    if (threadIndex === -1) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: "user",
      text,
      time: timeStr
    };

    const updatedThreads = [...chats];
    const thread = { ...updatedThreads[threadIndex] };
    thread.messages = [...thread.messages, userMsg];
    thread.lastMessage = text;
    thread.lastMessageTime = timeStr;
    
    updatedThreads[threadIndex] = thread;
    setChats(updatedThreads);
    localStorage.setItem("mooday_chats", JSON.stringify(updatedThreads));

    // Simulate smart auto-reply from seller
    setTimeout(() => {
      let replyText = "";
      const lowerText = text.toLowerCase();

      // Simple keywords in English & Arabic
      if (lowerText.includes("authentic") || lowerText.includes("اصل") || lowerText.includes("أصلي")) {
        replyText = language === "ar"
          ? "نعم، هذا أصلي 100٪. لقد اشتريته من المتجر الرسمي ويمكنني تقديم الإيصال إذا لزم الأمر."
          : "Yes, it is 100% authentic! I purchased it from the official store and can share receipts if needed.";
      } else if (lowerText.includes("offer") || lowerText.includes("price") || lowerText.includes("discount") || lowerText.includes("سعره") || lowerText.includes("خصم") || lowerText.includes("تخفيض")) {
        replyText = language === "ar"
          ? "أنا منفتح على العروض المعقولة، لكن يرجى العلم أنه معروض بالفعل بسعر جيد جداً مقارنة بسعر التجزئة الأصلي!"
          : "I am open to reasonable offers, but please note it's already priced very low compared to its retail price!";
      } else if (lowerText.includes("condition") || lowerText.includes("damage") || lowerText.includes("نظيف") || lowerText.includes("عيوب")) {
        replyText = language === "ar"
          ? "الحالة ممتازة كما هو موضح بالصور. لا توجد خدوش أو تلف، واستخدمته بضع مرات فقط."
          : "The condition is excellent, just like in the photos. No scratches or damage, lightly used only a few times.";
      } else {
        replyText = language === "ar"
          ? "شكراً لك. سأتحقق من ذلك وأرد عليك بالتفاصيل قريباً!"
          : "Thanks! Let me check on that and get back to you with the details shortly.";
      }

      const sellerMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        sender: "seller",
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      const finalThreads = [...updatedThreads];
      const targetThread = { ...finalThreads[threadIndex] };
      targetThread.messages = [...targetThread.messages, sellerMsg];
      targetThread.lastMessage = replyText;
      targetThread.lastMessageTime = sellerMsg.time;

      finalThreads[threadIndex] = targetThread;
      setChats(finalThreads);
      localStorage.setItem("mooday_chats", JSON.stringify(finalThreads));
    }, 1500);
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        listings,
        addListing,
        likes,
        toggleLike,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        chats,
        sendChatMessage,
        createChatThread,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
