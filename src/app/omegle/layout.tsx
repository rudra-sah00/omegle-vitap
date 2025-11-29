import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Video Chat Room - Live Random Chat | Omegle VITAP',
  description:
    'You are now in the video chat room. Talk to strangers via video, audio, or text chat. Skip to next stranger anytime. Free anonymous video chat.',
  robots: {
    index: false, // Don't index the chat room itself
    follow: true,
  },
  alternates: {
    canonical: 'https://vitap.in/omegle',
  },
};

export default function OmegleLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
