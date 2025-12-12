"use client";

import { useTranslation } from "../hooks/useTranslation";
import { Film } from "lucide-react";
import MovieSearch from "./MovieSearch";

interface HeaderProps {
  onSearchResults: (results: any[]) => void;
  onQueryChange: (query: string) => void;
  isLoading?: boolean;
}

export default function Header({ onSearchResults, onQueryChange, isLoading }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <header className="sticky top-0 z-10 w-full border-b border-zinc-800 bg-[#0A0A0A] backdrop-blur-sm h-20">
      <div className="max-w-7xl mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Film className="h-6 w-6 text-amber-400" />
          <h1 className="text-xl font-bold text-white sm:text-2xl">CineLog</h1>
        </div>
        <div className="flex-1 flex justify-center px-10">
          <MovieSearch
            onSearchResults={onSearchResults}
            onQueryChange={onQueryChange}
            isLoading={isLoading}
          />
        </div>
        <div className="w-32"></div> {/* 右側のスペーサー */}
      </div>
    </header>
  );
}

