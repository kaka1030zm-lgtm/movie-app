"use client";

import { useState, useEffect } from "react";
import { Search, Film } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { MovieSearchResult } from "./types";

interface MovieSearchProps {
  onSelectMovie: (movie: MovieSearchResult) => void;
}

export default function MovieSearch({ onSelectMovie }: MovieSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { t, apiLang } = useTranslation();

  const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  const searchMovies = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsLoading(true);
    setHasSearched(true);

    try {
      if (!TMDB_API_KEY) {
        // デモ用のサンプルデータ
        setResults([
          {
            id: 1,
            title: "サンプル映画 1",
            overview: "これはデモ用のサンプル映画です。",
            poster_path: null,
            backdrop_path: null,
            vote_average: 8.5,
            media_type: "movie",
          },
          {
            id: 2,
            title: "サンプル映画 2",
            overview: "TMDB APIキーを設定すると実際のデータが表示されます。",
            poster_path: null,
            backdrop_path: null,
            vote_average: 7.8,
            media_type: "movie",
          },
        ]);
        setIsLoading(false);
        return;
      }

      const response = await fetch(
        `https://api.themoviedb.org/3/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}&language=${apiLang}`
      );
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error("Error searching movies:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchMovies(query);
  };

  const handleSelectMovie = (movie: MovieSearchResult) => {
    onSelectMovie(movie);
    setQuery("");
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900/50 py-3 pl-10 pr-4 text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md bg-amber-400 px-4 py-1.5 text-sm font-medium text-black transition-colors hover:bg-amber-300 disabled:opacity-50"
          >
            {isLoading ? t.processing : t.search}
          </button>
        </div>
      </form>

      {!TMDB_API_KEY && hasSearched && (
        <p className="mb-2 text-sm text-amber-400">{t.demoSearch}</p>
      )}

      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-zinc-400">{t.searchResults}</h3>
          <div className="max-h-64 space-y-2 overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900/30 p-2">
            {results.map((movie) => (
              <button
                key={movie.id}
                onClick={() => handleSelectMovie(movie)}
                className="flex w-full items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900/50 p-3 text-left transition-colors hover:border-amber-400/50 hover:bg-zinc-800/50"
              >
                {movie.poster_path ? (
                  <img
                    src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                    alt={movie.title || movie.name}
                    className="h-16 w-12 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-12 items-center justify-center rounded bg-zinc-800">
                    <Film className="h-6 w-6 text-zinc-600" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className="truncate font-medium text-white">
                    {movie.title || movie.name}
                  </h4>
                  <p className="truncate text-xs text-zinc-400">
                    {movie.overview || t.noOverview}
                  </p>
                  <p className="mt-1 text-xs text-zinc-500">
                    {movie.release_date || movie.first_air_date || ""}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {hasSearched && results.length === 0 && !isLoading && (
        <p className="text-center text-sm text-zinc-500">検索結果が見つかりませんでした</p>
      )}
    </div>
  );
}

