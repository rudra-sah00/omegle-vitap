import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Start Chatting - Omegle VITAP",
  description:
    "Connect with random people worldwide through video and text chat. Anonymous, safe, and free. Start chatting now!",
  openGraph: {
    title: "Start Chatting - Omegle VITAP",
    description:
      "Connect with random people worldwide through video and text chat. Anonymous, safe, and free.",
    url: "https://vitap.in/omegle",
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
    title: "Start Chatting - Omegle VITAP",
    description:
      "Connect with random people worldwide through video and text chat. Anonymous, safe, and free.",
    images: ["https://vitap.in/public_brand.png"],
  },
};

export default function OmegleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
