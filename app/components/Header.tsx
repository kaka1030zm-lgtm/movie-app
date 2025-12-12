"use client";

import Link from "next/link";
import { Film } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#1a1a1a] bg-black/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Film className="h-6 w-6 text-[#D4AF37]" />
          <h1 className="text-xl font-bold text-white">CineLog</h1>
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/"
            className="text-sm font-medium text-gray-300 hover:text-[#D4AF37] transition-colors"
          >
            レビュー一覧
          </Link>
        </nav>
      </div>
    </header>
  );
}
