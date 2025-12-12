"use client";

import { useState, useEffect, useRef } from "react";
import { Search, X } from "lucide-react";
import { MovieSearchResult } from "./types";

interface MovieSearchProps {
  onMovieSelect: (movie: MovieSearchResult) => void;
}

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

export default function MovieSearch({ onMovieSelect }: MovieSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MovieSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

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

  return (
    <div ref={searchRef} className="relative w-full max-w-2xl">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="映画を検索..."
          className="w-full rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] py-3 pl-10 pr-10 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
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

      {showResults && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 max-h-96 overflow-y-auto rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] shadow-xl z-50">
          {results.map((movie) => (
            <button
              key={movie.id}
              onClick={() => handleMovieClick(movie)}
              className="w-full flex items-center gap-4 p-4 hover:bg-[#1a1a1a] transition-colors text-left"
            >
              {movie.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`}
                  alt={movie.title}
                  className="w-16 h-24 object-cover rounded"
                />
              ) : (
                <div className="w-16 h-24 bg-[#1a1a1a] rounded flex items-center justify-center">
                  <span className="text-2xl">🎬</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-medium truncate">{movie.title}</h3>
                {movie.release_date && (
                  <p className="text-sm text-gray-400">{movie.release_date}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
