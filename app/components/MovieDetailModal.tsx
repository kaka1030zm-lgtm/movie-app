"use client";

import { useState, useEffect } from "react";
import { X, Plus, Star } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { MovieSearchResult, WatchlistItem } from "./types";

interface MovieDetailModalProps {
  movie: MovieSearchResult | null;
  isInWatchlist: boolean;
  onClose: () => void;
  onAddToWatchlist: (movie: MovieSearchResult) => void;
  onRemoveFromWatchlist: (movieId: number) => void;
  onWriteReview: (movie: MovieSearchResult) => void;
}

export default function MovieDetailModal({
  movie,
  isInWatchlist,
  onClose,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onWriteReview,
}: MovieDetailModalProps) {
  const { t, apiLang } = useTranslation();
  const [movieDetails, setMovieDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  useEffect(() => {
    if (!movie || !TMDB_API_KEY) return;

    const fetchDetails = async () => {
      setIsLoading(true);
      try {
        const mediaType = movie.media_type || (movie.name ? "tv" : "movie");
        const response = await fetch(
          `https://api.themoviedb.org/3/${mediaType}/${movie.id}?api_key=${TMDB_API_KEY}&language=${apiLang}`
        );
        const data = await response.json();
        setMovieDetails(data);
      } catch (error) {
        console.error("Error fetching movie details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDetails();
  }, [movie, TMDB_API_KEY, apiLang]);

  if (!movie) return null;

  const handleWatchlistToggle = () => {
    if (isInWatchlist) {
      onRemoveFromWatchlist(movie.id);
    } else {
      onAddToWatchlist(movie);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-zinc-800/80 p-2 text-zinc-400 transition-colors hover:bg-zinc-700 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {movie.backdrop_path && (
          <div className="relative h-64 w-full">
            <img
              src={`https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`}
              alt={movie.title || movie.name}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/50 to-transparent" />
          </div>
        )}

        <div className="p-6">
          <div className="mb-6 flex gap-6">
            {movie.poster_path && (
              <img
                src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                alt={movie.title || movie.name}
                className="h-64 w-44 flex-shrink-0 rounded object-cover"
              />
            )}
            <div className="flex-1">
              <h2 className="mb-2 text-3xl font-bold text-white">
                {movie.title || movie.name}
              </h2>
              {movie.original_title && movie.original_title !== movie.title && (
                <p className="mb-4 text-zinc-400">{movie.original_title}</p>
              )}
              <div className="mb-4 flex items-center gap-4">
                {movie.vote_average > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                    <span className="text-white">{movie.vote_average.toFixed(1)}</span>
                  </div>
                )}
                <span className="text-zinc-400">
                  {movie.release_date || movie.first_air_date}
                </span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleWatchlistToggle}
                  className={`flex items-center gap-2 rounded-lg px-4 py-2 font-medium transition-colors ${
                    isInWatchlist
                      ? "border border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
                      : "bg-amber-400 text-black hover:bg-amber-300"
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  {isInWatchlist ? t.removeFromWatchlist : t.addToWatchlist}
                </button>
                <button
                  onClick={() => onWriteReview(movie)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-4 py-2 font-medium text-white transition-colors hover:bg-zinc-700"
                >
                  {t.writeReview}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-semibold text-white">概要</h3>
              <p className="text-zinc-300">
                {movieDetails?.overview || movie.overview || t.noOverview}
              </p>
            </div>

            {isLoading && (
              <div className="text-center text-zinc-400">{t.processing}</div>
            )}

            {movieDetails && (
              <>
                {movieDetails.genres && movieDetails.genres.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-lg font-semibold text-white">ジャンル</h3>
                    <div className="flex flex-wrap gap-2">
                      {movieDetails.genres.map((genre: any) => (
                        <span
                          key={genre.id}
                          className="rounded bg-zinc-800 px-3 py-1 text-sm text-zinc-300"
                        >
                          {genre.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

