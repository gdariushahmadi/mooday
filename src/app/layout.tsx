import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Bodoni_Moda, Noto_Sans_Arabic, El_Messiri } from "next/font/google";
import { AppProvider } from "@/context/AppContext";
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
  title: "Mooday - Resell & Rent Pre-loved Fashion",
  description: "A peer-to-peer marketplace for women in the UAE to resell or rent out fashion items they bought or received as gifts. Dresses, shoes, bags, and accessories find a second life.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mooday",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1.0,
  maximumScale: 1.0,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#512443",
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
          {children}
        </AppProvider>
      </body>
    </html>
  );
}
