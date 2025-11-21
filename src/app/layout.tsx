import { UserProvider } from "@/context/UserContext";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "react-hot-toast";
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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://omegle-vitap.vercel.app'),
  title: "Omegle VITAP - Connect Anonymously",
  description: "Connect with strangers anonymously and make new friends at VITAP. Talk to fellow VITAP students in real-time.",
  keywords: ["omegle", "vitap", "anonymous chat", "students", "vellore"],
  authors: [{ name: "Omegle VITAP Team" }],
  openGraph: {
    title: "Omegle VITAP - Connect Anonymously",
    description: "Connect with strangers anonymously and make new friends at VITAP. Talk to fellow VITAP students in real-time.",
    url: "https://omegle-vitap.vercel.app",
    siteName: "Omegle VITAP",
    images: [
      {
        url: "/public_brand.png",
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
    title: "Omegle VITAP - Connect Anonymously",
    description: "Connect with strangers anonymously and make new friends at VITAP. Talk to fellow VITAP students in real-time.",
    images: ["/public_brand.png"],
    creator: "@omeglevitap",
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/hero.png",
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
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Toaster />
        <UserProvider>
          {children}
        </UserProvider>
      </body>
    </html>
  );
}
