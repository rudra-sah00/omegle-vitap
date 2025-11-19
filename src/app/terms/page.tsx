import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>

        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="leading-relaxed">
              By accessing and using this service, you accept and agree to be bound by the terms and
              provision of this agreement. If you do not agree to abide by the above, please do not
              use this service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Use of Service</h2>
            <p className="leading-relaxed mb-3">
              This service allows you to communicate with random strangers through video and text
              chat. By using this service, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Be at least 18 years of age or have parental consent</li>
              <li>Not engage in any illegal activities</li>
              <li>Not transmit any harmful or malicious content</li>
              <li>Not harass, abuse, or harm other users</li>
              <li>
                Not share personal information such as addresses, phone numbers, or financial
                details
              </li>
              <li>Not impersonate any person or entity</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Privacy</h2>
            <p className="leading-relaxed mb-3">
              We respect your privacy and are committed to protecting it. Please note:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Conversations are not recorded or monitored</li>
              <li>We do not store chat logs or video recordings</li>
              <li>Basic usage data may be collected for service improvement</li>
              <li>You are solely responsible for the information you choose to share</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Content and Conduct</h2>
            <p className="leading-relaxed mb-3">
              You are solely responsible for your conduct and any content that you submit, post, or
              display on or via the service. We reserve the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Remove or refuse to distribute any content on the service</li>
              <li>Suspend or terminate users who violate these terms</li>
              <li>Disclose any information as necessary to satisfy any law or regulation</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Prohibited Content</h2>
            <p className="leading-relaxed mb-3">
              The following types of content are strictly prohibited:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Nudity or sexually explicit content</li>
              <li>Violence or threats of violence</li>
              <li>Hate speech or discriminatory content</li>
              <li>Content involving minors in any inappropriate context</li>
              <li>Spam, advertising, or commercial content</li>
              <li>Copyright or trademark infringement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              6. Disclaimer of Warranties
            </h2>
            <p className="leading-relaxed">
              This service is provided "as is" without any warranties, expressed or implied. We do
              not warrant that the service will be uninterrupted, secure, or error-free. You use the
              service at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              7. Limitation of Liability
            </h2>
            <p className="leading-relaxed">
              We shall not be liable for any indirect, incidental, special, consequential, or
              punitive damages resulting from your use or inability to use the service. You
              acknowledge that you are solely responsible for any interactions with other users.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. User Safety</h2>
            <p className="leading-relaxed mb-3">Your safety is important. Please remember:</p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Never share personal information with strangers</li>
              <li>Disconnect immediately if you feel uncomfortable</li>
              <li>Report any inappropriate behavior or content</li>
              <li>Do not meet in person with people you meet online</li>
              <li>Be cautious of scams and fraudulent activities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Termination</h2>
            <p className="leading-relaxed">
              We reserve the right to terminate or suspend access to the service immediately,
              without prior notice or liability, for any reason whatsoever, including without
              limitation if you breach the Terms of Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              10. Modifications to Terms
            </h2>
            <p className="leading-relaxed">
              We reserve the right to modify or replace these terms at any time. If a revision is
              material, we will provide notice prior to any new terms taking effect. Your continued
              use of the service after any changes constitutes acceptance of those changes.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Governing Law</h2>
            <p className="leading-relaxed">
              These terms shall be governed and construed in accordance with applicable laws,
              without regard to its conflict of law provisions. Our failure to enforce any right or
              provision of these terms will not be considered a waiver of those rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Contact Information</h2>
            <p className="leading-relaxed">
              If you have any questions about these Terms of Service, please contact us through the
              appropriate channels provided on our platform.
            </p>
          </section>

          <div className="pt-8 mt-12 border-t border-gray-200">
            <p className="text-sm text-gray-500">Last updated: November 19, 2025</p>
            <p className="text-sm text-gray-500 mt-2">
              By using this service, you acknowledge that you have read and understood these terms
              and agree to be bound by them.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
