import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-pink-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-lg text-purple-600 mb-8">For VIT Campus Community</p>

          <div className="space-y-8 text-gray-700">
            <section className="bg-purple-50 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                📜 Your Agreement to These Terms
              </h2>
              <p className="leading-relaxed">
                Welcome to the VIT student community platform! By using this service, you agree to
                these terms. This is a student-created platform designed to foster respectful
                connections among VIT campus students. Please read carefully.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing and using this anonymous video chat service, you accept and agree to be
                bound by these terms. If you do not agree to these terms, please do not use this
                service. Your continued use constitutes acceptance of any updates to these terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Service Description</h2>
              <p className="leading-relaxed mb-3">This platform provides VIT students with:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Anonymous video and text chat with random VIT students</li>
                <li>No registration required - instant access</li>
                <li>Peer-to-peer connections for privacy</li>
                <li>Theme customization (light/dark mode)</li>
                <li>Cross-campus connections (Vellore, Chennai, AP, Bhopal)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. Eligibility & User Requirements
              </h2>
              <p className="leading-relaxed mb-3">To use this service, you must:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Be at least 18 years of age</li>
                <li>Be a current VIT student or have VIT campus affiliation</li>
                <li>Have access to a device with camera and microphone</li>
                <li>Agree to behave respectfully and follow community guidelines</li>
                <li>Not be previously banned for violating these terms</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Acceptable Use</h2>
              <p className="leading-relaxed mb-3">When using this platform, you agree to:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>✅ Treat other students with respect and kindness</li>
                <li>✅ Use appropriate language and behavior</li>
                <li>✅ Respect others' privacy and boundaries</li>
                <li>✅ Disconnect politely if you're not interested in chatting</li>
                <li>✅ Report inappropriate behavior to help keep the community safe</li>
                <li>✅ Use the platform for its intended purpose - meeting fellow students</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Prohibited Conduct</h2>
              <p className="leading-relaxed mb-3">
                The following behaviors are strictly prohibited and may result in immediate ban:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>❌ Nudity or sexually explicit content of any kind</li>
                <li>❌ Harassment, bullying, or abusive behavior</li>
                <li>❌ Hate speech, discrimination, or offensive content</li>
                <li>❌ Violence or threats of any nature</li>
                <li>❌ Sharing or requesting personal information inappropriately</li>
                <li>❌ Impersonation of others or false representation</li>
                <li>❌ Spam, advertising, or commercial solicitation</li>
                <li>❌ Recording or screenshotting without consent</li>
                <li>❌ Illegal activities or content</li>
                <li>❌ Attempting to bypass security measures</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. VIT Campus-Specific Rules
              </h2>
              <p className="leading-relaxed mb-3">
                As a platform for VIT students, please observe:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Maintain the reputation and dignity of VIT campuses</li>
                <li>Do not share confidential academic information</li>
                <li>Respect VIT's code of conduct even in anonymous settings</li>
                <li>Do not use the platform to organize prohibited activities</li>
                <li>Be mindful that you represent the VIT community</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Privacy & Safety</h2>
              <p className="leading-relaxed mb-3">For your own safety:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Never share your full name, phone number, or hostel details</li>
                <li>Don't share your student ID, registration number, or academic credentials</li>
                <li>Avoid sharing social media profiles with strangers</li>
                <li>Never share financial information or payment details</li>
                <li>Do not arrange in-person meetings with strangers</li>
                <li>Be cautious of scams or suspicious requests</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. Content & Intellectual Property
              </h2>
              <p className="leading-relaxed mb-3">Regarding content on the platform:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>You retain ownership of any content you share</li>
                <li>You are solely responsible for your words and actions</li>
                <li>Do not share copyrighted material without permission</li>
                <li>The platform's code and design are protected by copyright</li>
                <li>Remember: conversations are not recorded, but others may remember them</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                9. Disclaimer of Warranties
              </h2>
              <p className="leading-relaxed mb-3">Important disclaimers about the service:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Service is provided "AS IS" without warranties of any kind</li>
                <li>We do not guarantee uninterrupted or error-free service</li>
                <li>Technical issues may occur with video/audio connections</li>
                <li>We are not responsible for the behavior of other users</li>
                <li>You use the service at your own risk</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                10. Limitation of Liability
              </h2>
              <p className="leading-relaxed">
                We shall not be liable for any damages arising from: your use of the service,
                interactions with other users, technical malfunctions, loss of data, or any other
                issues. You acknowledge that online interactions carry inherent risks and you
                participate voluntarily.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                11. Reporting & Enforcement
              </h2>
              <p className="leading-relaxed mb-3">We take violations seriously:</p>
              <ul className="list-disc list-inside space-y-2 pl-4">
                <li>Report inappropriate behavior using the report button</li>
                <li>Violations will be reviewed and may result in bans</li>
                <li>Severe violations may be reported to VIT authorities</li>
                <li>We reserve the right to terminate access without notice</li>
                <li>Bans may be temporary or permanent based on severity</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                12. Service Modifications
              </h2>
              <p className="leading-relaxed">
                We reserve the right to modify, suspend, or discontinue any part of the service at
                any time without notice. We may also update features, change matching algorithms, or
                adjust the platform as needed to improve user experience.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Changes to Terms</h2>
              <p className="leading-relaxed">
                These terms may be updated periodically. Material changes will be posted on this
                page with an updated effective date. Your continued use after changes constitutes
                acceptance of the new terms. We encourage you to review these terms regularly.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Governing Law</h2>
              <p className="leading-relaxed">
                These terms are governed by the laws of India. Any disputes shall be subject to the
                jurisdiction of courts in the location of the relevant VIT campus. We operate under
                Indian IT laws and regulations.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Contact</h2>
              <p className="leading-relaxed">
                Questions about these terms? Need to report a serious issue? Contact us through the
                platform's support channels. For urgent safety concerns, please also reach out to
                VIT campus security or authorities.
              </p>
            </section>

            <div className="pt-8 mt-12 border-t-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
              <p className="text-sm text-gray-600 font-semibold">Last updated: November 20, 2025</p>
              <p className="text-sm text-gray-600 mt-2">
                By using this service, you acknowledge that you have read, understood, and agree to
                be bound by these Terms of Service. Be respectful, stay safe, and enjoy connecting
                with fellow VIT students! 🎓
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-4 justify-center flex-wrap">
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              Back to Home
            </Link>
            <Link
              href="/privacy"
              className="inline-block px-8 py-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-lg transition-colors border-2 border-gray-300"
            >
              Privacy Policy
            </Link>
            <Link
              href="/community"
              className="inline-block px-8 py-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-lg transition-colors border-2 border-gray-300"
            >
              Community Guidelines
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
