import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Community Guidelines - Safe Chat Rules | Omegle VITAP',
  description: 'Community guidelines for safe random video chatting. Learn the do\'s and don\'ts for a positive experience on Omegle VITAP. Zero tolerance for harassment.',
  alternates: {
    canonical: 'https://vitap.in/community-guidelines',
  },
  openGraph: {
    title: 'Community Guidelines | Omegle VITAP',
    description: 'Guidelines for safe and respectful random video chat on Omegle VITAP.',
    url: 'https://vitap.in/community-guidelines',
    type: 'website',
  },
};

export default function CommunityGuidelinesPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Community Guidelines",
    "description": "Community guidelines for safe random video chatting on Omegle VITAP",
    "url": "https://vitap.in/community-guidelines",
    "isPartOf": {
      "@type": "WebSite",
      "name": "Omegle VITAP",
      "url": "https://vitap.in"
    },
    "breadcrumb": {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://vitap.in" },
        { "@type": "ListItem", "position": 2, "name": "Community Guidelines", "item": "https://vitap.in/community-guidelines" }
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
            Community Guidelines
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed">
            Omegle VITAP is a community for students to connect. To keep this community safe and enjoyable for everyone, we ask that you follow these guidelines.
          </p>
        </header>

        <div className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight">
          <div className="grid gap-8 md:grid-cols-2 mb-12">
            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <h3 className="text-xl font-bold text-green-600 mb-4 flex items-center gap-2">
                <span className="text-2xl">✅</span> Do's
              </h3>
              <ul className="space-y-3 text-slate-600 list-none pl-0">
                <li className="flex gap-3">
                  <span className="font-bold text-slate-900">•</span>
                  Be respectful and kind to strangers.
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-slate-900">•</span>
                  Keep conversations friendly and open.
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-slate-900">•</span>
                  Report inappropriate behavior immediately.
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-slate-900">•</span>
                  Protect your personal information.
                </li>
              </ul>
            </div>

            <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100">
              <h3 className="text-xl font-bold text-red-600 mb-4 flex items-center gap-2">
                <span className="text-2xl">❌</span> Don'ts
              </h3>
              <ul className="space-y-3 text-slate-600 list-none pl-0">
                <li className="flex gap-3">
                  <span className="font-bold text-slate-900">•</span>
                  <span className="font-bold text-red-600">NO NUDITY or Sexual Content.</span>
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-slate-900">•</span>
                  Bully, harass, or threaten others.
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-slate-900">•</span>
                  Share explicit or illegal content.
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-slate-900">•</span>
                  Spam or advertise products/services.
                </li>
                <li className="flex gap-3">
                  <span className="font-bold text-slate-900">•</span>
                  Impersonate staff or other students.
                </li>
              </ul>
            </div>
          </div>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Safety Tips for Unauthenticated Chats</h2>
            <p className="text-slate-600 leading-relaxed mb-4">
              Since you are chatting with strangers without authentication, please be extra vigilant:
            </p>
            <ul className="list-disc pl-6 space-y-2 text-slate-600">
              <li><strong>Never share personal details:</strong> Do not reveal your full name, phone number, address, or social media handles.</li>
              <li><strong>Be careful with links:</strong> Do not click on links sent by strangers as they may be malicious.</li>
              <li><strong>Trust your instincts:</strong> If a conversation makes you uncomfortable, disconnect immediately.</li>
            </ul>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Zero Tolerance Policy</h2>
            <p className="text-slate-600 leading-relaxed">
              We have a zero-tolerance policy for harassment, hate speech, and illegal content. Users found violating these rules will be permanently banned from the platform. We cooperate with university administration and law enforcement when necessary.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4">Reporting Violations</h2>
            <p className="text-slate-600 leading-relaxed">
              If you encounter someone violating these guidelines, please disconnect immediately. Your safety is our priority.
            </p>
          </section>

          <section className="bg-blue-50 p-8 rounded-3xl border border-blue-100 mt-12">
            <h2 className="text-xl font-bold text-blue-900 mb-2">Need Help?</h2>
            <p className="text-blue-700 mb-0">
              If you are in immediate danger or need urgent assistance, please contact campus security or local emergency services.
            </p>
          </section>
        </div>
      </main>
    </div>
    </>
  );
}
