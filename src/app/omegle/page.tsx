"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import UserInfoModal from "@/app/_components/UserInfoModal";

export default function OmegleLanding() {
  const [showUserInfoModal, setShowUserInfoModal] = useState(false);
  const [selectedYear, setSelectedYear] = useState("");
  const [showYearDropdown, setShowYearDropdown] = useState(false);
  const router = useRouter();

  const years = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

  const handleUserInfoSubmit = (name: string, gender: string) => {
    // Store user info in localStorage
    localStorage.setItem("userInfo", JSON.stringify({ name, gender, timestamp: Date.now() }));
    setShowUserInfoModal(false);
    router.push("/omegle/chat");
  };

  return (
    <div className="min-h-screen bg-[#4FC3F7] flex flex-col">
      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row items-center justify-center lg:justify-between px-4 sm:px-8 md:px-16 lg:px-24 py-8 lg:py-0 max-w-7xl mx-auto w-full gap-8 lg:gap-12">
        {/* Left Side - Branding */}
        <div className="flex-1 flex flex-col items-center justify-center w-full">
          {/* Hero Image */}
          <div className="relative w-full max-w-sm sm:max-w-md lg:max-w-3xl">
            <Image
              src="/hero.png"
              alt="Omegle VITAP"
              width={800}
              height={640}
              className="w-full h-auto object-contain"
              priority
            />
          </div>
        </div>

        {/* Right Side - Form Card */}
        <div className="flex-1 flex justify-center lg:justify-end w-full">
          <div className="bg-white/20 backdrop-blur-lg rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl border border-white/30">
            <form className="space-y-4 sm:space-y-5" onSubmit={(e) => { e.preventDefault(); setShowUserInfoModal(true); }}>
              <div>
                <input
                  type="text"
                  placeholder="Your Name *"
                  className="w-full px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 placeholder-gray-600 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm"
                  required
                />
              </div>
              
              {/* Custom Year Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowYearDropdown(!showYearDropdown)}
                  className="w-full px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 text-gray-600 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm text-left flex items-center justify-between"
                >
                  <span className={selectedYear ? "text-gray-800" : "text-gray-600"}>
                    {selectedYear || "Select Year *"}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-600 transition-transform ${showYearDropdown ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showYearDropdown && (
                  <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
                    {years.map((year) => (
                      <button
                        key={year}
                        type="button"
                        onClick={() => {
                          setSelectedYear(year);
                          setShowYearDropdown(false);
                        }}
                        className={`w-full px-4 sm:px-5 py-3 text-left font-medium transition-colors ${
                          selectedYear === year
                            ? "bg-blue-50 text-blue-600"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {year}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <textarea
                  placeholder="Interests (optional)"
                  rows={3}
                  className="w-full px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl bg-white/60 backdrop-blur-sm border border-white/40 placeholder-gray-600 text-gray-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none shadow-sm"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 sm:py-4 rounded-lg transition-all shadow-lg"
              >
                Start Chatting
              </button>

              <p className="text-center text-xs sm:text-sm text-white/80">
                By continuing, you agree to our{" "}
                <Link href="/terms" className="underline hover:text-white">
                  Terms
                </Link>{" "}
                &{" "}
                <Link href="/privacy" className="underline hover:text-white">
                  Privacy
                </Link>
              </p>
            </form>
          </div>
        </div>
      </main>

      {/* Floating Avatar */}
      <div className="fixed bottom-4 left-4 sm:bottom-8 sm:left-8">
        <div className="bg-gray-800 rounded-full w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center text-white font-bold shadow-lg">
          N
        </div>
      </div>

      {/* User Info Modal */}
      <UserInfoModal
        isOpen={showUserInfoModal}
        onSubmit={handleUserInfoSubmit}
        onClose={() => setShowUserInfoModal(false)}
      />
    </div>
  );
}
