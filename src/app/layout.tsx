import {
  UserProvider,
  MediaStateProvider,
  FirebaseProvider,
  MaintenanceGuard,
  ToastProvider,
} from "@/providers";
import { BrowserPolyfillInit, GlobalErrorHandler } from "@/components/common";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { HeroUIProvider } from "@heroui/system";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://vitap.in'),
  title: "Omegle VITAP - Free Random Video Chat with Strangers | Talk to Strangers Online",
  description: "Free random video chat and text chat with strangers online. Talk to random people, meet new friends anonymously. Omegle alternative for random stranger chat, video call, and instant messaging. Connect with thousands of users worldwide for free random chat.",
  keywords: [
    // Primary keywords
    "omegle",
    "random chat",
    "stranger chat",
    "talk to strangers",
    "random video chat",
    "chat with strangers",
    "omegle alternative",
    "random stranger chat",

    // Video chat keywords
    "random video call",
    "video chat with strangers",
    "free video chat",
    "webcam chat",
    "cam chat",
    "video chat online",
    "random cam chat",

    // Text chat keywords
    "random text chat",
    "anonymous chat",
    "stranger talk",
    "anonymous messaging",
    "text chat strangers",
    "instant chat",

    // Omegle-related
    "omegle chat",
    "omegle video",
    "like omegle",
    "omegle app",
    "omegle online",
    "omegle free",

    // Social/Meeting keywords
    "meet strangers",
    "meet new people",
    "make friends online",
    "random people chat",
    "online friends",
    "meet random people",
    "anonymous friends",

    // General chat keywords
    "free chat",
    "online chat",
    "live chat",
    "chat online free",
    "chat rooms",
    "random chat app",
    "stranger video chat",

    // Location-specific
    "vitap",
    "vellore chat",
    "indian chat",
    "chat india",

    // Features
    "anonymous",
    "no registration chat",
    "instant chat",
    "skip chat",
    "next stranger",
  ],
  authors: [{ name: "Omegle VITAP Team" }],
  openGraph: {
    title: "Omegle VITAP - Free Random Video Chat with Strangers",
    description: "Free random video chat and text chat with strangers online. Talk to random people, meet new friends anonymously. Connect instantly, no registration required.",
    url: "https://vitap.in/",
    siteName: "Omegle VITAP",
    images: [
      {
        url: "https://vitap.in/public_brand.png",
        width: 1200,
        height: 630,
        alt: "Omegle VITAP - Talk to strangers",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Omegle VITAP - Random Video Chat with Strangers",
    description: "random video chat and text chat with strangers. Talk to random people, meet new friends anonymously. Omegle alternative for instant stranger chat.",
    images: ["https://vitap.in/public_brand.png"],
    creator: "@omeglevitap",
  },
  alternates: {
    canonical: "https://vitap.in",
  },
  category: "social networking",
  classification: "Random Video Chat, Stranger Chat, Social Networking",
  icons: {
    icon: [
      { url: "/omegle.png", sizes: "any", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/omegle.png",
    shortcut: "/omegle.png",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Omegle VITAP",
    "description": "Free random video chat and text chat with strangers online. Talk to random people, meet new friends anonymously.",
    "url": "https://vitap.in",
    "applicationCategory": "SocialNetworkingApplication",
    "operatingSystem": "Any",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Random video chat",
      "Text chat with strangers",
      "Anonymous chatting",
      "No registration required",
      "Free forever",
      "Skip to next stranger",
      "Instant connection"
    ],
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.5",
      "ratingCount": "1000",
      "bestRating": "5",
      "worstRating": "1"
    }
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {/* Add your Google Search Console verification code here */}
        {/* <meta name="google-site-verification" content="YOUR_CODE" /> */}
        <link rel="canonical" href="https://vitap.in" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <BrowserPolyfillInit />
        <GlobalErrorHandler />
        <HeroUIProvider>
          <ToastProvider>
            <MaintenanceGuard>
              <FirebaseProvider>
                <UserProvider>
                  <MediaStateProvider>
                    {children}
                  </MediaStateProvider>
                </UserProvider>
              </FirebaseProvider>
            </MaintenanceGuard>
          </ToastProvider>
        </HeroUIProvider>
      </body>
    </html>
  );
}
