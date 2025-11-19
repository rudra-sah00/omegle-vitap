import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "Omegle VITAP - Chat with Random Strangers",
  description:
    "Connect with random people worldwide through video and text chat. Anonymous, safe, and free. Start chatting now!",
  keywords: ["omegle", "random chat", "video chat", "stranger chat", "anonymous chat", "vitap"],
  authors: [{ name: "Omegle VITAP" }],
  metadataBase: new URL("https://vitap.in"),
  openGraph: {
    title: "Omegle VITAP - Chat with Random Strangers",
    description:
      "Connect with random people worldwide through video and text chat. Anonymous, safe, and free.",
    url: "https://vitap.in",
    siteName: "Omegle VITAP",
    images: [
      {
        url: "https://vitap.in/public_brand.png",
        width: 1200,
        height: 630,
        alt: "Omegle VITAP - Random Video Chat",
        type: "image/png",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Omegle VITAP - Chat with Random Strangers",
    description:
      "Connect with random people worldwide through video and text chat. Anonymous, safe, and free.",
    images: ["https://vitap.in/public_brand.png"],
    creator: "@omeaglevitap",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
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
  return (
    <html lang="en">
      <head>
        <meta property="og:image" content="https://vitap.in/public_brand.png" />
        <meta property="og:image:secure_url" content="https://vitap.in/public_brand.png" />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content="Omegle VITAP - Random Video Chat" />
        <meta name="twitter:image" content="https://vitap.in/public_brand.png" />
        <link rel="canonical" href="https://vitap.in" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>{children}</body>
    </html>
  );
}
