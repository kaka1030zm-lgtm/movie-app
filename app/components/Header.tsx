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
    <header className="sticky top-0 z-10 w-full border-b border-zinc-800 bg-[#0A0A0A] backdrop-blur-sm h-20">
      <div className="max-w-7xl mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <Film className="h-6 w-6 text-amber-400" />
          <h1 className="text-xl font-bold text-white sm:text-2xl">CineLog</h1>
        </Link>
        <div className="flex-1 flex justify-center px-10">
          <MovieSearch
            onSearchResults={onSearchResults}
            onQueryChange={onQueryChange}
            onError={onError}
            isLoading={isLoading}
          />
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/watchlist"
            className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800"
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

