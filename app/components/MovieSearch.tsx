"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X, Film, Filter } from "lucide-react";
import { MovieSearchResult } from "@/types/movie";
import { searchMulti, getGenres } from "@/lib/tmdb";

interface MovieSearchProps {
  onMovieSelect: (movie: MovieSearchResult) => void;
}

export default function MovieSearch({ onMovieSelect }: MovieSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedGenre, setSelectedGenre] = useState<number | null>(null);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ジャンル一覧を取得
  useEffect(() => {
    getGenres("movie")
      .then((data) => setGenres(data))
      .catch((error) => console.error("Error fetching genres:", error));
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
  }, [query, selectedGenre, selectedYear]);

  const performSearch = async (searchQuery: string) => {
    setIsLoading(true);
    try {
      const response = await searchMulti(searchQuery, 1);
      if (response.results) {
        // 映画とTVのみをフィルター（personを除外）
        const filtered = response.results
          .filter((item) => item.media_type === "movie" || item.media_type === "tv")
          .map((movie) => ({
            id: movie.id,
            title: movie.title || movie.name || "",
            poster_path: movie.poster_path,
            release_date: movie.release_date || movie.first_air_date || null,
            overview: movie.overview,
            vote_average: movie.vote_average,
            popularity: movie.popularity,
            genres: movie.genres,
            media_type: movie.media_type as "movie" | "tv",
          }));

        // ジャンルフィルター
        let filteredResults = filtered;
        if (selectedGenre) {
          filteredResults = filteredResults.filter((movie) =>
            movie.genres?.some((g) => g.id === selectedGenre)
          );
        }

        // 年代フィルター
        if (selectedYear) {
          filteredResults = filteredResults.filter((movie) => {
            if (!movie.release_date) return false;
            const year = new Date(movie.release_date).getFullYear();
            return year === selectedYear;
          });
        }

        setResults(filteredResults);
      }
    } catch (error) {
      console.error("Error searching movies:", error);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i);

  return (
    <div className="w-full">
      {/* 検索バー */}
      <div className="relative w-full max-w-2xl mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="映画・ドラマを検索..."
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

      {/* フィルター */}
      {query.trim() && (
        <div className="mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] text-white hover:border-[#D4AF37]/50 transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span>フィルター</span>
          </button>

          {showFilters && (
            <div className="mt-4 p-4 rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              {/* ジャンル */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  ジャンル
                </label>
                <select
                  value={selectedGenre || ""}
                  onChange={(e) =>
                    setSelectedGenre(e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="w-full rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="">すべて</option>
                  {genres.map((genre) => (
                    <option key={genre.id} value={genre.id}>
                      {genre.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 年代 */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  公開年
                </label>
                <select
                  value={selectedYear || ""}
                  onChange={(e) =>
                    setSelectedYear(e.target.value ? parseInt(e.target.value) : null)
                  }
                  className="w-full rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none"
                >
                  <option value="">すべて</option>
                  {years.map((year) => (
                    <option key={year} value={year}>
                      {year}年
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 検索結果 */}
      {query.trim() && results.length > 0 && (
        <div>
          <h3 className="text-2xl font-bold text-white mb-6">
            検索結果 ({results.length}件)
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {results.map((movie) => {
              const posterUrl = movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : null;
              return (
                <button
                  key={movie.id}
                  onClick={() => onMovieSelect(movie)}
                  className="group flex flex-col h-full overflow-hidden rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] hover:border-[#D4AF37]/50 transition-all duration-500 text-left"
                >
                  <div className="relative w-full aspect-[2/3] overflow-hidden transition-transform duration-500 group-hover:scale-105">
                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={movie.title}
                        className="object-cover w-full h-full transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-[#2a2a2a] flex flex-col items-center justify-center">
                        <Film className="h-12 w-12 text-gray-600 mb-2" />
                        <p className="text-xs text-gray-500 text-center px-2 line-clamp-2">
                          {movie.title}
                        </p>
                      </div>
                    )}
                  </div>
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
        </div>
      )}

      {query.trim() && !isLoading && results.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">検索結果が見つかりませんでした</p>
        </div>
      )}
    </div>
  );
}
