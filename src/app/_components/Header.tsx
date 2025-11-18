"use client";

import { useAuth } from "@/context";
import { useRouter, usePathname } from "next/navigation";

export default function Header() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const isHomePage = pathname === "/home";

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  };

  return (
    <header className="w-full py-4 px-6 bg-blue-600 flex items-center justify-between">
      <h1 className="text-white text-2xl font-bold">
        {isHomePage ? "" : "Talk to strangers"}
      </h1>
      
      {user && (
        <div className="flex items-center gap-4 ml-auto">
          <div className="flex items-center gap-2">
            {user.photoURL && (
              <img 
                src={user.photoURL} 
                alt="User" 
                className="w-8 h-8 rounded-full"
              />
            )}
            <span className="text-white text-sm hidden sm:inline">
              {user.displayName || user.email}
            </span>
          </div>
          <button
            onClick={handleSignOut}
            className="bg-white text-blue-600 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100 transition-colors text-sm"
          >
            Sign Out
          </button>
        </div>
      )}
    </header>
  );
}
