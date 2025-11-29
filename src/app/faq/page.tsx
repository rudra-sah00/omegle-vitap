import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'FAQ - Random Video Chat Questions | Omegle VITAP',
  description:
    'Frequently asked questions about random video chat, stranger chat, and how to use Omegle VITAP for free anonymous chatting.',
};

export default function FAQPage() {
  const faqCategories = [
    {
      category: 'Getting Started',
      icon: '🚀',
      questions: [
        {
          question: 'What is Omegle VITAP?',
          answer:
            "Omegle VITAP is a free random video chat platform where you can talk to strangers online. Connect with random people worldwide for video chat, text chat, or voice chat anonymously. It's designed specifically for students to make new friends and have interesting conversations.",
        },
        {
          question: 'Do I need to register to use random chat?',
          answer:
            'No registration required! Simply enter your name and gender preferences, then start chatting with random strangers immediately. We value your privacy and make it easy to jump right into conversations.',
        },
        {
          question: 'How does random video chat work?',
          answer:
            "Click 'Start Chat' and you'll be instantly connected with a random stranger for video chat. If you want to talk to someone else, just click 'Next' to skip to the next person. It's that simple!",
        },
      ],
    },
    {
      category: 'Pricing & Features',
      icon: '💰',
      questions: [
        {
          question: 'Is Omegle VITAP free?',
          answer:
            'Yes! Omegle VITAP is completely free to use. No registration, no subscription, no hidden fees. Start random video chat with strangers instantly without any cost, forever.',
        },
        {
          question: 'Can I use text chat instead of video?',
          answer:
            'Yes! You can toggle your camera off and use text-only chat to talk to strangers if you prefer anonymous text messaging. You also have full control over your microphone settings.',
        },
        {
          question: 'Can I choose who I talk to?',
          answer:
            'You can select gender preferences before starting. Our algorithm matches you with random strangers based on your preferences for the best chat experience. However, matches are still random within your selected preferences.',
        },
      ],
    },
    {
      category: 'Safety & Privacy',
      icon: '🔒',
      questions: [
        {
          question: 'Is stranger chat safe and anonymous?',
          answer:
            'We prioritize your privacy. Chats are anonymous and not recorded. However, always follow our community guidelines and never share personal information with strangers. Your safety is in your hands.',
        },
        {
          question: 'How do you protect my privacy?',
          answer:
            'We don&apos;t store chat logs or video recordings. No personal data is required to use the platform. Connections are peer-to-peer whenever possible, and we use end-to-end encryption for all communications.',
        },
        {
          question: 'What should I do if someone behaves inappropriately?',
          answer:
            "Click 'Next' immediately to disconnect from that person. You can also report violations through our community guidelines. We have a zero-tolerance policy for harassment and illegal content.",
        },
      ],
    },
    {
      category: 'Technical Support',
      icon: '⚙️',
      questions: [
        {
          question: 'What browsers are supported?',
          answer:
            'Omegle VITAP works best on modern browsers like Chrome, Firefox, Safari, and Edge. Make sure your browser has permission to access your camera and microphone.',
        },
        {
          question: "Why can't others see or hear me?",
          answer:
            'Check if your browser has permission to access your camera and microphone. Also verify that no other application is using your devices. Try refreshing the page or restarting your browser if issues persist.',
        },
        {
          question: 'What makes this different from Omegle?',
          answer:
            "Omegle VITAP offers the same random chat experience with improved performance, better matching algorithm, enhanced safety features, and a more modern interface designed for today's users.",
        },
      ],
    },
  ];

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqCategories.flatMap((cat) =>
      cat.questions.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: {
          '@type': 'Answer',
          text: faq.answer,
        },
      }))
    ),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100">
        <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-100">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link
              href="/welcome"
              className="font-bold text-xl tracking-tight hover:text-blue-600 transition-colors"
            >
              Omegle VITAP
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/community-guidelines"
                className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors"
              >
                Guidelines
              </Link>
              <Link
                href="/welcome"
                className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
              >
                Start Chat
              </Link>
            </div>
          </div>
        </nav>

        <main className="max-w-6xl mx-auto px-6 py-16 sm:py-24">
          <header className="mb-16 text-center">
            <div className="inline-block mb-4 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-semibold">
              Help Center
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight mb-6 text-slate-900">
              Frequently Asked Questions
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-3xl mx-auto">
              Everything you need to know about random video chat, stranger chat, and how to use
              Omegle VITAP
            </p>
          </header>

          <div className="grid gap-12 lg:gap-16">
            {faqCategories.map((category, categoryIndex) => (
              <section key={categoryIndex} className="scroll-mt-20">
                <div className="flex items-center gap-3 mb-8">
                  <span className="text-4xl">{category.icon}</span>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                    {category.category}
                  </h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {category.questions.map((faq, index) => (
                    <div
                      key={index}
                      className="bg-slate-50 p-6 rounded-2xl border border-slate-100 hover:shadow-lg hover:border-slate-200 transition-all duration-200"
                    >
                      <h3 className="text-lg font-bold text-slate-900 mb-3 leading-tight">
                        {faq.question}
                      </h3>
                      <p className="text-slate-600 leading-relaxed text-sm">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <section className="mt-20 bg-gradient-to-br from-blue-50 to-cyan-50 p-10 sm:p-16 rounded-3xl border border-blue-100 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
              Ready to Start Chatting?
            </h2>
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto">
              Join thousands of users enjoying free random video chat with strangers worldwide.
              Connect instantly, no registration required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/welcome"
                className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl transition-all hover:scale-105 shadow-lg"
              >
                Start Random Chat Now
              </Link>
              <Link
                href="/community-guidelines"
                className="inline-block bg-white hover:bg-slate-50 text-slate-900 font-semibold px-8 py-4 rounded-xl transition-all border border-slate-200"
              >
                Read Guidelines
              </Link>
            </div>
          </section>

          <section className="mt-16 p-8 bg-amber-50 rounded-2xl border border-amber-100">
            <div className="flex gap-4">
              <span className="text-3xl">💡</span>
              <div>
                <h3 className="text-xl font-bold text-amber-900 mb-2">Still Have Questions?</h3>
                <p className="text-amber-800 leading-relaxed">
                  Can&apos;t find the answer you&apos;re looking for? Check out our{' '}
                  <Link
                    href="/community-guidelines"
                    className="font-semibold underline hover:text-amber-900"
                  >
                    Community Guidelines
                  </Link>{' '}
                  for more detailed information about using the platform safely and responsibly.
                </p>
              </div>
            </div>
          </section>
        </main>

        <footer className="border-t border-slate-100 mt-24 py-12">
          <div className="max-w-6xl mx-auto px-6 text-center text-sm text-slate-500">
            <div className="flex flex-wrap justify-center gap-6 mb-6">
              <Link href="/privacy" className="hover:text-slate-900 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-slate-900 transition-colors">
                Terms of Service
              </Link>
              <Link href="/community-guidelines" className="hover:text-slate-900 transition-colors">
                Community Guidelines
              </Link>
            </div>
            <p>© 2025 Omegle VITAP. Free random video chat with strangers.</p>
          </div>
        </footer>
      </div>
    </>
  );
}
