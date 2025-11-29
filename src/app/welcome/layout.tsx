import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Start Random Video Chat - Free Omegle Alternative | Omegle VITAP',
  description:
    'Start free random video chat with strangers instantly. Talk to random people online, meet new friends anonymously. Best Omegle alternative for random stranger chat. No registration required.',
  alternates: {
    canonical: 'https://vitap.in/welcome',
  },
  openGraph: {
    title: 'Start Random Video Chat | Omegle VITAP',
    description:
      'Start free random video chat with strangers instantly. Best Omegle alternative - no registration required.',
    url: 'https://vitap.in/welcome',
    type: 'website',
    images: [
      {
        url: 'https://vitap.in/public_brand.png',
        width: 1200,
        height: 630,
        alt: 'Omegle VITAP - Start Random Video Chat',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Start Random Video Chat | Omegle VITAP',
    description: 'Start free random video chat with strangers instantly. No registration required.',
    images: ['https://vitap.in/public_brand.png'],
  },
};

export default function WelcomeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
