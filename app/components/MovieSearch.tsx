"use client";

import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { MovieSearchResult } from "./types";

interface MovieSearchProps {
  onSearchResults: (results: MovieSearchResult[]) => void;
  onQueryChange: (query: string) => void;
  isLoading?: boolean;
}

export default function MovieSearch({ onSearchResults, onQueryChange, isLoading }: MovieSearchProps) {
  const [query, setQuery] = useState("");
  const { t, apiLang } = useTranslation();
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  const searchMovies = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      onSearchResults([]);
      onQueryChange("");
      return;
    }

    onQueryChange(searchQuery);

    try {
      if (!TMDB_API_KEY) {
        onSearchResults([]);
        return;
      }

      const response = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}&language=${apiLang}`
      );
      const data = await response.json();
      onSearchResults(data.results || []);
    } catch (error) {
      console.error("Error searching movies:", error);
      onSearchResults([]);
    }
  };

  // デバウンス処理（300ms）
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      searchMovies(query);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  return (
    <div className="w-full max-w-xl">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900/80 py-3 pl-12 pr-4 text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-amber-400 border-t-transparent"></div>
          </div>
        )}
      </div>
    </div>
  );
}

