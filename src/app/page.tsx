"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Header from "@/app/_components/Header";
import MainLayout from "@/app/_components/MainLayout";
import InfoBox from "@/app/_components/InfoBox";

export default function Home() {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const router = useRouter();

  const handleEnter = () => {
    if (agreedToTerms) {
      router.push("/home");
    }
  };

  return (
    <MainLayout>
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-2xl space-y-8">
          <InfoBox />
          
          <div className="flex flex-col items-center space-y-6">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">
                I agree to the{" "}
                <Link href="/terms" className="text-blue-600 hover:underline">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
              </span>
            </label>

            <button
              onClick={handleEnter}
              disabled={!agreedToTerms}
              className={
                "px-12 py-4 rounded-lg font-semibold text-lg transition-all " +
                (agreedToTerms
                  ? "bg-gray-900 text-white hover:bg-gray-800 cursor-pointer"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed")
              }
            >
              Enter
            </button>
          </div>
        </div>
      </main>
    </MainLayout>
  );
}
