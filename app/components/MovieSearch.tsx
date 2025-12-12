"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Film } from "lucide-react";
import { MovieSearchResult } from "./types";

interface MovieSearchProps {
  onMovieSelect: (movie: MovieSearchResult) => void;
}

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

// ポスターURLを生成する関数
const getPosterUrl = (posterPath: string | null | undefined): string | null => {
  if (!posterPath || posterPath.trim() === "") {
    return null;
  }
  if (posterPath.startsWith("http://") || posterPath.startsWith("https://")) {
    return posterPath;
  }
  return `${TMDB_IMAGE_BASE}${posterPath}`;
};

export default function MovieSearch({ onMovieSelect }: MovieSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [popularMovies, setPopularMovies] = useState<MovieSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPopular, setIsLoadingPopular] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  // 初期ロード時に人気映画を取得
  useEffect(() => {
    fetchPopularMovies();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    debounceTimerRef.current = setTimeout(async () => {
      await searchMovies(query);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [query]);

  const fetchPopularMovies = async () => {
    if (!TMDB_API_KEY) {
      console.error("TMDB API key is not set");
      return;
    }

    setIsLoadingPopular(true);
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=ja-JP&page=1`
      );
      const data = await response.json();
      
      if (data.results) {
        const movies: MovieSearchResult[] = data.results.map((movie: any) => ({
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          overview: movie.overview,
        }));
        setPopularMovies(movies);
      }
    } catch (error) {
      console.error("Error fetching popular movies:", error);
    } finally {
      setIsLoadingPopular(false);
    }
  };

  const searchMovies = async (searchQuery: string) => {
    if (!TMDB_API_KEY) {
      console.error("TMDB API key is not set");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}&language=ja-JP`
      );
      const data = await response.json();
      
      if (data.results) {
        const movies: MovieSearchResult[] = data.results.map((movie: any) => ({
          id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
          release_date: movie.release_date,
          overview: movie.overview,
        }));
        setResults(movies);
        setShowResults(true);
      }
    } catch (error) {
      console.error("Error searching movies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMovieClick = (movie: MovieSearchResult) => {
    onMovieSelect(movie);
    setQuery("");
    setShowResults(false);
  };

  const displayMovies = query.trim() ? results : popularMovies;
  const displayTitle = query.trim() ? "検索結果" : "Trending Movies (人気の映画)";

  return (
    <div className="w-full">
      {/* 検索バー */}
      <div ref={searchRef} className="relative w-full max-w-2xl mb-8">
        <div className="relative flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="映画を検索..."
              className="w-full h-12 rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] py-3 pl-10 pr-10 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
            />
            {query && (
              <button
                onClick={() => {
                  setQuery("");
                  setResults([]);
                  setShowResults(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {isLoading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#D4AF37] border-t-transparent"></div>
              </div>
            )}
          </div>
        </div>

        {/* ドロップダウン検索結果 */}
        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] shadow-xl z-50">
            {results.map((movie) => {
              const posterUrl = getPosterUrl(movie.poster_path);
              return (
                <button
                  key={movie.id}
                  onClick={() => handleMovieClick(movie)}
                  className="w-full flex items-center gap-4 p-4 hover:bg-[#1a1a1a] transition-colors text-left"
                >
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={movie.title}
                      className="w-16 h-24 object-cover rounded aspect-[2/3]"
                    />
                  ) : (
                    <div className="w-16 h-24 bg-[#2a2a2a] rounded flex items-center justify-center aspect-[2/3]">
                      <Film className="h-8 w-8 text-gray-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">{movie.title}</h3>
                    {movie.release_date && (
                      <p className="text-sm text-gray-400">{movie.release_date}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
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
                          className="object-cover w-full h-full"
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
                      {movie.overview && (
                        <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed">
                          {movie.overview}
                        </p>
                      )}
                      {movie.release_date && (
                        <p className="text-xs text-gray-500 mt-2">{movie.release_date}</p>
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
