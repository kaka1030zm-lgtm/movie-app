"use client";

import { useTranslation } from "../hooks/useTranslation";
import { Film, Bookmark } from "lucide-react";
import MovieSearch from "./MovieSearch";
import Link from "next/link";

interface HeaderProps {
  onSearchResults: (results: any[]) => void;
  onQueryChange: (query: string) => void;
  onError?: (error: string) => void;
  isLoading?: boolean;
}

export default function Header({ onSearchResults, onQueryChange, onError, isLoading }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#2a2a2a]/50 glass h-20">
      <div className="max-w-7xl mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link 
          href="/" 
          className="flex items-center gap-3 group transition-all duration-300"
        >
          <div className="relative">
            <Film className="h-7 w-7 text-[#d4af37] transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12" />
            <div className="absolute inset-0 bg-[#d4af37]/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-white via-[#fafafa] to-[#d4af37] bg-clip-text text-transparent sm:text-3xl tracking-tight">
            CineLog
          </h1>
        </Link>
        <div className="flex-1 flex justify-center px-10">
          <MovieSearch
            onSearchResults={onSearchResults}
            onQueryChange={onQueryChange}
            onError={onError}
            isLoading={isLoading}
          />
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/watchlist"
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-white/90 transition-all duration-300 hover:bg-white/5 hover:text-white hover:scale-105 border border-white/5 hover:border-white/10"
            title="見たいリスト"
          >
            <Bookmark className="h-5 w-5" />
            <span className="hidden sm:inline">マイリスト</span>
          </Link>
        </div>
      </div>
    </header>
  );
}

