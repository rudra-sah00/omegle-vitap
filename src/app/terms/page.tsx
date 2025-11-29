import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service - Rules & Guidelines | Omegle',
  description:
    'Read the terms of service for Omegle random video chat platform. Understand our rules, eligibility requirements, and user conduct guidelines.',
  alternates: {
    canonical: 'https://vitap.in/terms',
  },
  openGraph: {
    title: 'Terms of Service | Omegle',
    description: 'Terms and conditions for using Omegle random video chat platform.',
    url: 'https://vitap.in/terms',
    type: 'website',
  },
};

export default function TermsPage() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Terms of Service',
    description: 'Terms of service for Omegle random video chat platform',
    url: 'https://vitap.in/terms',
    isPartOf: {
      '@type': 'WebSite',
      name: 'Omegle',
      url: 'https://vitap.in',
    },
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://vitap.in' },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Terms of Service',
          item: 'https://vitap.in/terms',
        },
      ],
    },
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
            <Link
              href="/welcome"
              className="font-bold text-xl tracking-tight hover:text-blue-600 transition-colors"
            >
              Omegle
            </Link>
            <Link
              href="/welcome"
              className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
            >
              Back to Home
            </Link>
          </div>
        </nav>

        <main className="max-w-3xl mx-auto px-6 py-16 sm:py-24">
          <header className="mb-16">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight mb-6 text-slate-900">
              Terms of Service
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed">
              Please read these terms carefully before using Omegle. By accessing or using our
              service, you agree to be bound by these terms.
            </p>
            <div className="mt-6 flex items-center gap-2 text-sm text-slate-400 font-medium">
              <span>Last updated: November 29, 2025</span>
            </div>
          </header>

          <div className="prose prose-slate prose-lg max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-a:text-blue-600 hover:prose-a:text-blue-700">
            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4">1. Acceptance of Terms</h2>
              <p className="text-slate-600 leading-relaxed">
                By accessing and using Omegle (&quot;the Service&quot;), you accept and agree to be
                bound by the terms and provision of this agreement. In addition, when using this
                Service, you shall be subject to any posted guidelines or rules applicable to such
                services.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4">2. Eligibility</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                To use this Service, you must meet the following requirements:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600">
                <li>Be at least 18 years old</li>
                <li>Be a current college or university student</li>
                <li>Agree to follow all community guidelines and safety rules</li>
              </ul>
              <p className="text-slate-600 leading-relaxed mt-4">
                By using the Service, you represent and warrant that you meet these eligibility
                requirements and have the right, authority, and capacity to enter into this
                Agreement and abide by all of its terms and conditions.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4">3. User Conduct</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                You agree to use the Service only for lawful purposes. You are strictly prohibited
                from posting on or transmitting through the Service any material that:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-slate-600">
                <li>
                  <strong>Contains Nudity or Sexual Content:</strong> Any form of nudity, sexual
                  acts, or sexually explicit content is strictly prohibited and will result in an
                  immediate ban.
                </li>
                <li>
                  Is unlawful, harmful, threatening, abusive, harassing, defamatory, vulgar,
                  obscene, profane, hateful, or racially, ethnically, or otherwise objectionable.
                </li>
                <li>
                  Encourages conduct that would constitute a criminal offense, give rise to civil
                  liability, or otherwise violate any law.
                </li>
                <li>
                  Contains advertising or any solicitation with respect to products or services.
                </li>
                <li>Impersonates any person or entity.</li>
              </ul>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4">4. Safety & Anonymity Disclaimer</h2>
              <p className="text-slate-600 leading-relaxed mb-4">
                Interactions on Omegle are with random strangers from various colleges and
                universities. While we strive to maintain a safe environment through moderation and
                community guidelines, we cannot control the behavior of all users.
              </p>
              <p className="text-slate-600 leading-relaxed">
                You acknowledge that you are using the service at your own risk. Never share
                personal information such as your full name, address, phone number, student ID,
                financial information, or location details with strangers.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4">5. Disclaimer of Warranties</h2>
              <p className="text-slate-600 leading-relaxed">
                The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis.
                Omegle expressly disclaims all warranties of any kind, whether express or implied,
                including, but not limited to the implied warranties of merchantability, fitness for
                a particular purpose and non-infringement.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4">6. Limitation of Liability</h2>
              <p className="text-slate-600 leading-relaxed">
                Omegle shall not be liable for any direct, indirect, incidental, special,
                consequential or exemplary damages, including but not limited to, damages for loss
                of profits, goodwill, use, data or other intangible losses resulting from the use or
                the inability to use the service.
              </p>
            </section>

            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-4">7. Changes to Terms</h2>
              <p className="text-slate-600 leading-relaxed">
                We reserve the right, at our sole discretion, to modify or replace these Terms at
                any time. What constitutes a material change will be determined at our sole
                discretion.
              </p>
            </section>

            <section className="border-t border-slate-200 pt-12 mt-16">
              <p className="text-slate-500 text-sm">
                These terms are subject to change without notice. Please check back regularly for
                updates.
              </p>
            </section>
          </div>
        </main>
      </div>
    </>
  );
}
