import Link from "next/link";

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-emerald-50">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Community Guidelines
          </h1>
          <p className="text-lg text-green-600 mb-8">Building a Safe VIT Community Together</p>

          <div className="space-y-8 text-gray-700">
            <section className="bg-green-50 rounded-lg p-6">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                🤝 Welcome to Our Community!
              </h2>
              <p className="leading-relaxed mb-3">
                This platform is built by VIT students, for VIT students. Our mission is to create a
                safe, respectful space where students across all VIT campuses can connect, share
                experiences, and build friendships anonymously.
              </p>
              <p className="leading-relaxed">
                These guidelines help ensure everyone has a positive experience. By following them,
                you contribute to making this a welcoming community for all VITians.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. 🎯 Core Values</h2>
              <p className="leading-relaxed mb-3">
                Our community is built on these fundamental values:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">🤝 Respect</h3>
                  <p className="text-sm">
                    Treat everyone with dignity and courtesy, regardless of background, branch,
                    campus, or year.
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">🔒 Privacy</h3>
                  <p className="text-sm">
                    Respect others' anonymity. Don't pressure anyone to share personal information.
                  </p>
                </div>
                <div className="bg-pink-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">💚 Kindness</h3>
                  <p className="text-sm">
                    Be friendly and welcoming. Remember, everyone is here to make connections.
                  </p>
                </div>
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">🛡️ Safety</h3>
                  <p className="text-sm">
                    Look out for each other. Report concerning behavior to keep the community safe.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                2. ✅ Do's - What We Encourage
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-green-50 rounded-lg p-4">
                  <span className="text-2xl flex-shrink-0">👋</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Be Welcoming</h3>
                    <p className="text-sm text-gray-700">
                      Start conversations with a friendly greeting. Make others feel comfortable.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-green-50 rounded-lg p-4">
                  <span className="text-2xl flex-shrink-0">💬</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Have Meaningful Conversations</h3>
                    <p className="text-sm text-gray-700">
                      Talk about campus life, academics, hobbies, clubs, events, or common
                      interests. Share experiences and advice.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-green-50 rounded-lg p-4">
                  <span className="text-2xl flex-shrink-0">🚪</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Exit Politely</h3>
                    <p className="text-sm text-gray-700">
                      If you're not interested in continuing, say goodbye respectfully before
                      disconnecting.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-green-50 rounded-lg p-4">
                  <span className="text-2xl flex-shrink-0">📢</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Report Issues</h3>
                    <p className="text-sm text-gray-700">
                      Help keep the community safe by reporting inappropriate behavior immediately.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-green-50 rounded-lg p-4">
                  <span className="text-2xl flex-shrink-0">🎓</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Represent VIT Well</h3>
                    <p className="text-sm text-gray-700">
                      Remember you're part of the VIT community. Uphold the values and reputation of
                      our institution.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-green-50 rounded-lg p-4">
                  <span className="text-2xl flex-shrink-0">🌟</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">Be Authentic</h3>
                    <p className="text-sm text-gray-700">
                      Be yourself! Share genuine thoughts and experiences. Authenticity builds real
                      connections.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                3. ❌ Don'ts - What's Not Allowed
              </h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3 bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                  <span className="text-2xl flex-shrink-0">🚫</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">No Inappropriate Content</h3>
                    <p className="text-sm text-gray-700">
                      Absolutely no nudity, sexual content, or suggestive behavior. This is an
                      academic community platform.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                  <span className="text-2xl flex-shrink-0">😡</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">No Harassment or Bullying</h3>
                    <p className="text-sm text-gray-700">
                      Don't harass, bully, stalk, or make anyone uncomfortable. Respect boundaries
                      and consent.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                  <span className="text-2xl flex-shrink-0">💔</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">No Hate Speech</h3>
                    <p className="text-sm text-gray-700">
                      Zero tolerance for discrimination based on gender, religion, caste, region,
                      branch, campus, or any other factor.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                  <span className="text-2xl flex-shrink-0">📱</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">No Personal Info Pressure</h3>
                    <p className="text-sm text-gray-700">
                      Don't ask for or pressure others to share phone numbers, social media, hostel
                      details, or personal information.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                  <span className="text-2xl flex-shrink-0">📹</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">No Recording</h3>
                    <p className="text-sm text-gray-700">
                      Do not record, screenshot, or capture conversations without explicit consent.
                      Respect privacy.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                  <span className="text-2xl flex-shrink-0">💰</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">No Spam or Scams</h3>
                    <p className="text-sm text-gray-700">
                      No advertising, spam, phishing, or fraudulent activities. No asking for money
                      or financial information.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 bg-red-50 rounded-lg p-4 border-l-4 border-red-500">
                  <span className="text-2xl flex-shrink-0">⚠️</span>
                  <div>
                    <h3 className="font-semibold text-gray-900">No Illegal Activities</h3>
                    <p className="text-sm text-gray-700">
                      Don't discuss, promote, or engage in any illegal activities. This includes
                      academic dishonesty.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                4. 🎓 VIT-Specific Guidelines
              </h2>
              <div className="bg-blue-50 rounded-lg p-6 space-y-3">
                <p className="leading-relaxed">
                  <strong>All Campuses Welcome:</strong> This platform connects students from VIT
                  Vellore, Chennai, AP (Amaravati), and Bhopal. Embrace diversity across campuses!
                </p>
                <p className="leading-relaxed">
                  <strong>Academic Integrity:</strong> Don't use this platform to share exam
                  questions, assignments, or engage in any form of academic dishonesty.
                </p>
                <p className="leading-relaxed">
                  <strong>Campus Events:</strong> Feel free to discuss campus events, clubs, fests,
                  and activities. Help promote positive campus culture.
                </p>
                <p className="leading-relaxed">
                  <strong>Support Each Other:</strong> Share study tips, career advice, and campus
                  survival strategies. Help juniors, learn from seniors.
                </p>
                <p className="leading-relaxed">
                  <strong>Respect VIT Policies:</strong> Even though this is anonymous, remember
                  VIT's code of conduct applies to online behavior too.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. 🛡️ Safety Tips</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">🔐 Protect Your Identity</h3>
                  <ul className="text-sm space-y-1 list-disc list-inside text-gray-700">
                    <li>Don't reveal your full name</li>
                    <li>Don't share your student ID or reg number</li>
                    <li>Don't disclose your hostel or room number</li>
                    <li>Be vague about identifying details</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">🚨 Trust Your Instincts</h3>
                  <ul className="text-sm space-y-1 list-disc list-inside text-gray-700">
                    <li>If something feels wrong, disconnect</li>
                    <li>Don't feel obligated to continue</li>
                    <li>Report suspicious behavior</li>
                    <li>Block and move on if uncomfortable</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">💳 Financial Safety</h3>
                  <ul className="text-sm space-y-1 list-disc list-inside text-gray-700">
                    <li>Never share bank details or UPI IDs</li>
                    <li>Don't send money to strangers</li>
                    <li>Beware of sob stories or scams</li>
                    <li>No legitimate reason to ask for money</li>
                  </ul>
                </div>

                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">🤝 Meeting Offline</h3>
                  <ul className="text-sm space-y-1 list-disc list-inside text-gray-700">
                    <li>We strongly discourage meeting in person</li>
                    <li>If you choose to, meet in public spaces</li>
                    <li>Tell friends where you're going</li>
                    <li>Trust is earned over time, not instantly</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                6. 📢 Reporting & Moderation
              </h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-3">When to Report:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                  <li>Inappropriate or explicit content</li>
                  <li>Harassment or threatening behavior</li>
                  <li>Hate speech or discrimination</li>
                  <li>Spam or scam attempts</li>
                  <li>Minors using the platform</li>
                  <li>Any violation of these guidelines</li>
                </ul>

                <h3 className="font-semibold text-gray-900 mb-3">What Happens:</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-700">
                  <li>Reports are reviewed promptly</li>
                  <li>Violators may receive warnings or immediate bans</li>
                  <li>Serious violations reported to VIT authorities if needed</li>
                  <li>Your report is anonymous and confidential</li>
                  <li>False reports may result in your own account action</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                7. 🌟 Building Positive Connections
              </h2>
              <div className="space-y-3">
                <p className="leading-relaxed">
                  <strong>Great Conversation Starters:</strong> Ask about favorite campus spots,
                  clubs, subjects, career goals, hobbies, or upcoming events. Share funny campus
                  stories or seek advice.
                </p>
                <p className="leading-relaxed">
                  <strong>Topics to Explore:</strong> Campus life, academic challenges, career
                  aspirations, music, movies, sports, tech, gaming, books, food, travel plans, or
                  internship experiences.
                </p>
                <p className="leading-relaxed">
                  <strong>Making It Meaningful:</strong> Ask open-ended questions, share your own
                  experiences, listen actively, be genuine, and find common ground. The best
                  connections come from authentic conversations.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                8. ⚖️ Consequences of Violations
              </h2>
              <div className="space-y-3">
                <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
                  <h3 className="font-semibold text-gray-900">Minor Violations</h3>
                  <p className="text-sm text-gray-700">
                    First-time minor offenses may result in a warning. Repeated violations lead to
                    temporary suspension.
                  </p>
                </div>
                <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-600">
                  <h3 className="font-semibold text-gray-900">Serious Violations</h3>
                  <p className="text-sm text-gray-700">
                    Harassment, explicit content, or threats result in immediate permanent ban. No
                    warnings given for serious offenses.
                  </p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-600">
                  <h3 className="font-semibold text-gray-900">Severe Cases</h3>
                  <p className="text-sm text-gray-700">
                    Illegal activities, blackmail, or dangerous behavior may be reported to VIT
                    administration, campus security, or law enforcement.
                  </p>
                </div>
              </div>
            </section>

            <div className="pt-8 mt-12 border-t-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
              <p className="text-sm text-gray-600 font-semibold">Last updated: November 20, 2025</p>
              <p className="text-sm text-gray-600 mt-2">
                These guidelines are designed to create a positive experience for all VIT students.
                By following them, you help build a respectful, safe, and welcoming community. Thank
                you for being part of this!
              </p>
              <p className="text-sm text-gray-600 mt-3 font-semibold text-center">
                🎓 Made by VITians, for VITians. Let's keep it awesome! 🌟
              </p>
            </div>
          </div>

          <div className="mt-8 flex gap-4 justify-center flex-wrap">
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
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
              href="/terms"
              className="inline-block px-8 py-3 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-lg transition-colors border-2 border-gray-300"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
