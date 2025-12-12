"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Film } from "lucide-react";
import { MovieSearchResult } from "@/types/movie";
import { searchMovies, getPopularMovies, getPosterUrl } from "@/lib/tmdb";

interface MovieSearchProps {
  onMovieSelect: (movie: MovieSearchResult) => void;
}

export default function MovieSearch({ onMovieSelect }: MovieSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [popularMovies, setPopularMovies] = useState<MovieSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPopular, setIsLoadingPopular] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 初期ロード時に人気映画を取得
  useEffect(() => {
    fetchPopularMovies();
  }, []);

  // 検索のデバウンス処理
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      await performSearch(query);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  const fetchPopularMovies = async () => {
    setIsLoadingPopular(true);
    try {
      const response = await getPopularMovies(1);
      if (response.results) {
        setPopularMovies(
          response.results.map((movie) => ({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            overview: movie.overview,
            vote_average: movie.vote_average,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching popular movies:", error);
    } finally {
      setIsLoadingPopular(false);
    }
  };

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const response = await searchMovies(searchQuery, 1);
      if (response.results) {
        setResults(
          response.results.map((movie) => ({
            id: movie.id,
            title: movie.title,
            poster_path: movie.poster_path,
            release_date: movie.release_date,
            overview: movie.overview,
            vote_average: movie.vote_average,
          }))
        );
      }
    } catch (error) {
      console.error("Error searching movies:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMovieClick = (movie: MovieSearchResult) => {
    onMovieSelect(movie);
    setQuery("");
  };

  const displayMovies = query.trim() ? results : popularMovies;
  const displayTitle = query.trim() ? "検索結果" : "人気の映画";

  return (
    <div className="w-full">
      {/* 検索バー */}
      <div className="relative w-full max-w-2xl mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="映画を検索..."
            className="w-full h-14 pl-12 pr-12 rounded-full border border-[#1a1a1a] bg-[#0a0a0a] text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 transition-all"
          />
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
          {isLoading && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"></div>
            </div>
          )}
        </div>
      </div>

      {/* 映画グリッド表示 */}
      {(displayMovies.length > 0 || isLoadingPopular) && (
        <div>
          <h3 className="text-2xl font-bold text-white mb-6">{displayTitle}</h3>

          {isLoadingPopular && !query.trim() ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="aspect-[2/3] bg-[#1a1a1a] rounded-lg"></div>
                  <div className="h-4 bg-[#1a1a1a] rounded mt-2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {displayMovies.map((movie) => {
                const posterUrl = getPosterUrl(movie.poster_path);
                return (
                  <button
                    key={movie.id}
                    onClick={() => handleMovieClick(movie)}
                    className="group flex flex-col h-full overflow-hidden rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] hover:border-[#D4AF37]/50 transition-all text-left"
                  >
                    {/* 画像エリア */}
                    <div className="relative w-full aspect-[2/3] overflow-hidden">
                      {posterUrl ? (
                        <img
                          src={posterUrl}
                          alt={movie.title}
                          className="object-cover w-full h-full transition-transform group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.style.display = "flex";
                          }}
                        />
                      ) : null}
                      <div
                        className={`w-full h-full bg-[#2a2a2a] flex flex-col items-center justify-center ${
                          posterUrl ? "hidden" : ""
                        }`}
                      >
                        <Film className="h-12 w-12 text-gray-600 mb-2" />
                        <p className="text-xs text-gray-500 text-center px-2 line-clamp-2">
                          {movie.title}
                        </p>
                      </div>
                    </div>

                    {/* テキストエリア */}
                    <div className="flex-1 p-4 flex flex-col">
                      <h3 className="text-sm font-semibold text-white mb-1 line-clamp-2">
                        {movie.title}
                      </h3>
                      {movie.release_date && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(movie.release_date).getFullYear()}
                        </p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
