import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Bodoni_Moda, Noto_Sans_Arabic, El_Messiri } from "next/font/google";
import { AppProvider } from "@/context/AppContext";
import { ServiceWorkerRegistrar } from "@/components/ServiceWorkerRegistrar";
import "./globals.css";

const hankenGrotesk = Hanken_Grotesk({
  variable: "--font-family-sans-en",
  subsets: ["latin"],
  display: "swap",
});

const bodoniModa = Bodoni_Moda({
  variable: "--font-family-serif-en",
  subsets: ["latin"],
  display: "swap",
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-family-sans-ar",
  subsets: ["arabic"],
  display: "swap",
});

const elMessiri = El_Messiri({
  variable: "--font-family-serif-ar",
  subsets: ["arabic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Mooday - Resell & Rent Pre-loved Fashion",
    template: "%s | Mooday",
  },
  description:
    "A peer-to-peer marketplace for women in the UAE to resell or rent out fashion items they bought or received as gifts. Dresses, shoes, bags, and accessories find a second life.",
  applicationName: "Mooday",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mooday",
    startupImage: [
      // iPhone 14 Pro Max, 15 Pro Max
      {
        url: "/icons/apple-touch-icon.png",
        media: "(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    other: [
      {
        rel: "mask-icon",
        url: "/icons/icon-maskable-512x512.png",
        color: "#512443",
      },
    ],
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Mooday",
    "msapplication-TileColor": "#512443",
    "msapplication-TileImage": "/icons/icon-512x512.png",
    "msapplication-config": "none",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#512443" },
    { media: "(prefers-color-scheme: dark)", color: "#340a2a" },
  ],
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${hankenGrotesk.variable} ${bodoniModa.variable} ${notoSansArabic.variable} ${elMessiri.variable} h-full antialiased`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-full flex flex-col">
        <AppProvider>
          <ServiceWorkerRegistrar />
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
