"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context";
import Header from "@/app/_components/Header";
import MainLayout from "@/app/_components/MainLayout";
import InfoBox from "@/app/_components/InfoBox";
import StartButton from "@/app/_components/StartButton";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/home");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-900">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <MainLayout>
      <Header />
      
      <main className="flex-1 flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-2xl">
          <InfoBox />
          <StartButton />
        </div>
      </main>
    </MainLayout>
  );
}
