import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-lg text-blue-600 mb-8">For VIT Campus Community</p>

          <div className="space-y-8 text-gray-700">
            <section className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                🎓 Welcome VIT Students!
              </h2>
              <p className="leading-relaxed">
                This platform is designed for VIT students to connect anonymously and safely. We
                prioritize your privacy and ensure that your campus interactions remain secure and
                respectful.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                1. Information We Collect
              </h2>
              <p className="leading-relaxed mb-3">
                We believe in maximum privacy. When you use our service, we collect minimal
                information:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>No registration required - completely anonymous access</li>
                <li>Basic usage analytics to improve service quality</li>
                <li>Technical information (browser type, device information) for functionality</li>
                <li>Temporary session data (automatically deleted after disconnection)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. Your Conversations Are Private
              </h2>
              <p className="leading-relaxed mb-3">
                Your privacy during conversations is our top priority:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>✅ Zero conversation recording - We never record video or audio</li>
                <li>✅ No chat logs - Text messages are not stored anywhere</li>
                <li>✅ Peer-to-peer connections - Direct communication between students</li>
                <li>✅ Instant deletion - All data wiped when you disconnect</li>
                <li>✅ No conversation history - We cannot retrieve past chats</li>
                <li>✅ Anonymous by default - No identity tracking</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. How We Use Information
              </h2>
              <p className="leading-relaxed mb-3">
                We use minimal technical data only for essential purposes:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>To provide real-time video and text chat functionality</li>
                <li>To match you with other VIT students randomly</li>
                <li>To improve platform performance and user experience</li>
                <li>To detect and prevent abuse, harassment, or inappropriate content</li>
                <li>To maintain platform security and prevent spam</li>
                <li>To comply with legal obligations when required</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Sharing</h2>
              <p className="leading-relaxed mb-3">
                We respect your privacy and do not sell your information. We may share technical
                data only in these circumstances:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>With your explicit consent</li>
                <li>To comply with legal requirements or court orders</li>
                <li>To protect user safety and prevent harm</li>
                <li>
                  With service providers (Firebase, Agora) under strict confidentiality for
                  technical operations
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Cookies and Tracking</h2>
              <p className="leading-relaxed">
                We use minimal cookies and session storage to maintain your connection and
                preferences during your visit. These are temporary and automatically cleared when
                you close your browser or end your session. No long-term tracking or user profiling
                is performed.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Security</h2>
              <p className="leading-relaxed mb-3">
                We implement strong security measures to protect your experience:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Encrypted connections (HTTPS/SSL) for all communications</li>
                <li>Firebase App Check to prevent unauthorized access</li>
                <li>No storage of personal conversations or identifiable data</li>
                <li>Regular security updates and monitoring</li>
                <li>Peer-to-peer video connections for maximum privacy</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
              <p className="leading-relaxed mb-3">
                We practice minimal data retention for maximum privacy:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>No account data - Anonymous access means no stored profiles</li>
                <li>Conversation data is NEVER stored on our servers</li>
                <li>Session data is automatically deleted upon disconnection</li>
                <li>Aggregated analytics (non-identifiable) may be retained for improvements</li>
                <li>No personal information is retained after your session ends</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Your Rights</h2>
              <p className="leading-relaxed mb-3">As a user, you have complete control:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Disconnect anytime - End conversations whenever you want</li>
                <li>Complete anonymity - No registration or personal data required</li>
                <li>Report abuse - Flag inappropriate behavior immediately</li>
                <li>Choose visibility - Control your camera and microphone permissions</li>
                <li>Zero commitment - Use the platform without any data obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Age Restrictions & Campus Safety
              </h2>
              <p className="leading-relaxed mb-3">
                This platform is designed for adult college students:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Intended for VIT students aged 18 and above</li>
                <li>Not designed for minors or underage users</li>
                <li>Campus community-focused interactions</li>
                <li>Academic and social networking among peers</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Third-Party Services
              </h2>
              <p className="leading-relaxed mb-3">We use minimal third-party services:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Firebase - For real-time database and hosting infrastructure</li>
                <li>Agora - For WebRTC video and audio streaming (peer-to-peer)</li>
                <li>Google reCAPTCHA - For spam prevention and security</li>
              </ul>
              <p className="leading-relaxed mt-3">
                These services are carefully selected and comply with privacy standards. No personal
                data is shared with these providers beyond technical requirements.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. VIT Campus & Location Data
              </h2>
              <p className="leading-relaxed mb-3">
                This platform is tailored for the VIT community:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>
                  Designed for students across all VIT campuses (Vellore, Chennai, AP, Bhopal)
                </li>
                <li>No location tracking or GPS data collection</li>
                <li>Anonymous matching - We don't know which campus you're from</li>
                <li>Accessible from anywhere - On or off campus</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Changes to This Policy
              </h2>
              <p className="leading-relaxed">
                We may update this Privacy Policy to reflect changes in our practices or for legal
                reasons. Significant changes will be posted on this page with an updated effective
                date. Continued use of the platform after changes constitutes acceptance of the
                updated policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Safety First</h2>
              <p className="leading-relaxed mb-3">
                Your safety is our priority. Remember these tips:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>🔒 Never share personal details (phone number, address, hostel room)</li>
                <li>🎓 Don't share academic credentials or student ID details</li>
                <li>💳 Never share financial information or UPI IDs</li>
                <li>🚫 Disconnect immediately if you feel uncomfortable</li>
                <li>📢 Report inappropriate behavior to help keep the community safe</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Contact & Support</h2>
              <p className="leading-relaxed">
                Questions about privacy? Concerns about your data? We're here to help. Reach out
                through our support channels, and we'll respond promptly to address your privacy
                concerns.
              </p>
            </section>

            <div className="pt-8 mt-12 border-t-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
              <p className="text-sm text-gray-600 font-semibold">Last updated: November 20, 2025</p>
              <p className="text-sm text-gray-600 mt-2">
                By using this service, you acknowledge that you have read and understood this
                Privacy Policy and agree to its terms. This platform is made by VIT students, for
                VIT students.
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-4 justify-center flex-wrap">
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-gray-900 hover:bg-gray-800 text-white font-semibold rounded transition-colors"
            >
              Back to Home
            </Link>
            <Link
              href="/terms"
              className="inline-block px-8 py-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded transition-colors border-2 border-gray-300"
            >
              Terms of Service
            </Link>
            <Link
              href="/community"
              className="inline-block px-8 py-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded transition-colors border-2 border-gray-300"
            >
              Community Guidelines
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
