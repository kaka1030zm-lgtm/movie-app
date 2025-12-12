"use client";

import { useTranslation } from "../hooks/useTranslation";
import { Film } from "lucide-react";

export default function Header() {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-black/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Film className="h-6 w-6 text-amber-400" />
          <h1 className="text-xl font-bold text-white sm:text-2xl">CineLog</h1>
        </div>
        <div className="text-sm text-zinc-400">
          {t.watchlist}
        </div>
      </div>
    </header>
  );
}

