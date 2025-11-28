import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy - Your Data & Anonymity | Omegle VITAP',
  description: 'Read our privacy policy to understand how Omegle VITAP protects your data. Anonymous random video chat with no personal data required. Your privacy is our priority.',
  alternates: {
    canonical: 'https://vitap.in/privacy',
  },
  openGraph: {
    title: 'Privacy Policy | Omegle VITAP',
    description: 'Learn how we protect your privacy during anonymous random video chat. No personal data required.',
    url: 'https://vitap.in/privacy',
    type: 'website',
  },
};

export default function PrivacyPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Privacy Policy",
    "description": "Privacy policy for Omegle VITAP random video chat platform",
    "url": "https://vitap.in/privacy",
    "isPartOf": {
      "@type": "WebSite",
      "name": "Omegle VITAP",
      "url": "https://vitap.in"
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://vitap.in" },
        { "@type": "ListItem", "position": 2, "name": "Privacy Policy", "item": "https://vitap.in/privacy" }
      ]
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/welcome" className="font-bold text-xl tracking-tight hover:text-blue-600 transition-colors">
            Omegle VITAP
          </Link>
          <Link href="/welcome" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
            Back to Home
          </Link>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
        <header className="mb-16">
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-6 text-slate-900">
            Privacy Policy
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Your privacy is critically important to us. At Omegle VITAP, we have a few fundamental principles regarding your data and anonymity.
          </p>
          <div className="mt-6 flex items-center gap-2 text-sm text-slate-400 font-medium">
            <span>Last updated: November 21, 2025</span>
          </div>
        </header>

        <div className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 hover:prose-a:text-blue-700">
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">1. Information We Collect</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              We collect very little information about you. We do not require you to create an account to use the basic features of Omegle VITAP. However, for safety and moderation purposes:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li><strong>Log Data & IP Addresses:</strong> We collect your IP address and browser information. This is strictly used for moderation, banning users who violate our terms (e.g., nudity, harassment), and preventing abuse.</li>
              <li><strong>Chat Data:</strong> Chats are peer-to-peer where possible. We do not store chat logs on our servers after the chat session has ended, except for automated moderation snapshots to detect illegal content.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">2. Law Enforcement Cooperation</h2>
            <p className="text-slate-600 leading-relaxed">
              We cooperate fully with law enforcement agencies. If we detect illegal activities, including but not limited to child exploitation, severe harassment, or threats of violence, we will report your IP address and any available metadata to the appropriate authorities.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">3. How We Use Information</h2>
            <p className="text-slate-600 leading-relaxed">
              We use the information we collect primarily to provide, maintain, protect, and improve our Service, to develop new ones, and to protect Omegle VITAP and our users. We may also use this information to offer you tailored content – like giving you more relevant search results and ads.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">3. Cookies</h2>
            <p className="text-slate-600 leading-relaxed">
              We use cookies to store information about your preferences and to record user-specific information on visits to pages. You can choose to disable cookies through your individual browser options.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">4. Data Security</h2>
            <p className="text-slate-600 leading-relaxed">
              The security of your Personal Information is important to us, but remember that no method of transmission over the Internet, or method of electronic storage, is 100% secure. While we strive to use commercially acceptable means to protect your Personal Information, we cannot guarantee its absolute security.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">5. Third-Party Links</h2>
            <p className="text-slate-600 leading-relaxed">
              Our Service may contain links to external sites that are not operated by us. If you click on a third-party link, you will be directed to that third party's site. We strongly advise you to review the Privacy Policy and terms and conditions of every site you visit.
            </p>
          </section>

          <section className="border-t border-slate-200 pt-12 mt-16">
            <p className="text-slate-500 text-sm">
              This Privacy Policy is subject to change without notice. Please check back regularly for updates.
            </p>
          </section>
        </div>
      </main>
    </div>
    </>
  );
}
