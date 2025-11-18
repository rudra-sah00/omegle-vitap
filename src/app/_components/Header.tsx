"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === "/home";

  return (
    <header className="w-full py-6 px-6 bg-white border-b border-gray-200">
      <div className="flex items-center justify-center">
        <Link href="/" className="text-gray-900 text-3xl font-bold">
          {isHomePage ? "" : "Talk to strangers"}
        </Link>
      </div>
    </header>
  );
}
