import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Privacy Policy</h1>

        <div className="space-y-8 text-gray-700">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>
            <p className="leading-relaxed mb-3">
              We are committed to protecting your privacy. When you use our service, we collect
              minimal information necessary to provide the service:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>
                Basic account information (email, display name, profile picture) when you sign in
                with Google
              </li>
              <li>Usage data and analytics to improve service quality</li>
              <li>Technical information (browser type, device information, IP address)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Conversations</h2>
            <p className="leading-relaxed mb-3">
              Your privacy during conversations is important to us:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>We do not record, store, or monitor your video or text conversations</li>
              <li>Conversations are peer-to-peer and not saved on our servers</li>
              <li>Once a conversation ends, all messages are permanently deleted</li>
              <li>We cannot retrieve or provide copies of your conversations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              3. How We Use Your Information
            </h2>
            <p className="leading-relaxed mb-3">
              We use the collected information for the following purposes:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>To provide and maintain the service</li>
              <li>To authenticate users and prevent unauthorized access</li>
              <li>To improve and optimize the user experience</li>
              <li>To detect and prevent abuse, fraud, or illegal activities</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Sharing</h2>
            <p className="leading-relaxed mb-3">
              We respect your privacy and do not sell your personal information. We may share
              information only in the following circumstances:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>With your explicit consent</li>
              <li>To comply with legal requirements or respond to lawful requests</li>
              <li>To protect the rights, property, or safety of our users</li>
              <li>
                With service providers who assist in operating the platform (under strict
                confidentiality)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Cookies and Tracking</h2>
            <p className="leading-relaxed">
              We use cookies and similar technologies to maintain your session, remember your
              preferences, and analyze usage patterns. You can control cookie settings through your
              browser, but some features may not function properly if cookies are disabled.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
            <p className="leading-relaxed">
              We implement appropriate technical and organizational measures to protect your
              personal information against unauthorized access, alteration, disclosure, or
              destruction. However, no method of transmission over the internet is 100% secure, and
              we cannot guarantee absolute security.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="leading-relaxed mb-3">We retain your information as follows:</p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Account information is stored until you delete your account</li>
              <li>Conversation data is never stored on our servers</li>
              <li>Usage analytics may be retained for service improvement purposes</li>
              <li>Deleted accounts are marked as deleted in our database</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Your Rights</h2>
            <p className="leading-relaxed mb-3">
              You have the following rights regarding your personal information:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Access and review your account information</li>
              <li>Update or correct your information</li>
              <li>Delete your account at any time</li>
              <li>Control your privacy settings (such as showing your name)</li>
              <li>Opt out of certain data collection practices</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children's Privacy</h2>
            <p className="leading-relaxed">
              Our service is not intended for users under the age of 18. We do not knowingly collect
              personal information from children. If you believe a child has provided us with
              personal information, please contact us immediately, and we will take steps to remove
              such information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Third-Party Services</h2>
            <p className="leading-relaxed">
              We use Google Authentication for sign-in. When you sign in with Google, you are
              subject to Google's Privacy Policy. We recommend reviewing their privacy practices to
              understand how they handle your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. International Users</h2>
            <p className="leading-relaxed">
              Our service is accessible globally. By using the service, you consent to the transfer
              and processing of your information in accordance with this Privacy Policy, regardless
              of where you are located.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              12. Changes to This Policy
            </h2>
            <p className="leading-relaxed">
              We may update this Privacy Policy from time to time to reflect changes in our
              practices or for legal reasons. We will notify you of significant changes by posting
              the new policy on this page with an updated effective date.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
            <p className="leading-relaxed">
              If you have questions or concerns about this Privacy Policy or our data practices,
              please contact us through the appropriate channels provided on our platform.
            </p>
          </section>

          <div className="pt-8 mt-12 border-t border-gray-200">
            <p className="text-sm text-gray-500">Last updated: November 19, 2025</p>
            <p className="text-sm text-gray-500 mt-2">
              By using this service, you acknowledge that you have read and understood this Privacy
              Policy and agree to its terms.
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
