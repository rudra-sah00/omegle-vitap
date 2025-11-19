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
  description: "Connect with random people worldwide through video and text chat. Anonymous, safe, and free. Start chatting now!",
  keywords: ["omegle", "random chat", "video chat", "stranger chat", "anonymous chat", "vitap"],
  authors: [{ name: "Omegle VITAP" }],
  openGraph: {
    title: "Omegle VITAP - Chat with Random Strangers",
    description: "Connect with random people worldwide through video and text chat. Anonymous, safe, and free.",
    url: "https://vitap.in",
    siteName: "Omegle VITAP",
    images: [
      {
        url: "/hero.png",
        width: 1200,
        height: 630,
        alt: "Omegle VITAP - Random Video Chat",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Omegle VITAP - Chat with Random Strangers",
    description: "Connect with random people worldwide through video and text chat. Anonymous, safe, and free.",
    images: ["/hero.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
