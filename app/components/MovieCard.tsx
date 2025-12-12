"use client";

import { MovieSearchResult } from "./types";
import { Star, Film } from "lucide-react";

interface MovieCardProps {
  movie: MovieSearchResult;
  onClick: () => void;
  isLoading?: boolean;
  isInWatchlist?: boolean;
  onToggleWatchlist?: (movie: MovieSearchResult, e: React.MouseEvent) => void;
  isWatchlistLoading?: boolean;
}

export default function MovieCard({ 
  movie, 
  onClick, 
  isLoading, 
  isInWatchlist = false,
  onToggleWatchlist,
  isWatchlistLoading = false,
}: MovieCardProps) {
  if (isLoading) {
    return (
      <div className="group relative overflow-hidden rounded-lg bg-zinc-900/50 animate-pulse">
        <div className="aspect-[2/3] w-full bg-zinc-800"></div>
        <div className="p-3 space-y-2">
          <div className="h-4 bg-zinc-800 rounded w-3/4"></div>
          <div className="h-3 bg-zinc-800 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!movie || !movie.id) {
    return null;
  }

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleWatchlist) {
      onToggleWatchlist(movie, e);
    }
  };

  return (
    <div className="group relative overflow-hidden rounded-lg bg-zinc-900/50 transition-transform duration-200 hover:scale-[1.03] hover:shadow-xl animate-in fade-in">
      <button
        onClick={onClick}
        className="w-full"
      >
        <div className="aspect-[2/3] w-full relative">
          {movie.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
              alt={movie.title}
              className="h-full w-full object-cover rounded-lg"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-800 rounded-lg">
              <Film className="h-12 w-12 text-zinc-600" />
            </div>
          )}
          
          {/* ブックマークアイコン（右上） */}
          {onToggleWatchlist && (
            <button
              onClick={handleBookmarkClick}
              disabled={isWatchlistLoading}
              className={`absolute top-2 right-2 z-10 rounded-full p-2 backdrop-blur-sm transition-all duration-200 ${
                isInWatchlist
                  ? "bg-amber-400/90 text-black hover:bg-amber-400"
                  : "bg-black/50 text-white hover:bg-black/70 hover:text-amber-400"
              } ${isWatchlistLoading ? "opacity-50 cursor-not-allowed" : ""}`}
              title={isInWatchlist ? "見たいリストから削除" : "見たいリストに追加"}
            >
              {isWatchlistLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              ) : (
                <Star className={`h-5 w-5 ${isInWatchlist ? "fill-amber-400 text-amber-400" : "text-gray-400"}`} />
              )}
            </button>
          )}
        </div>
        {/* タイトルと評価用のスペース（高さ60px程度） */}
        <div className="h-[60px] p-3 flex flex-col justify-center">
          <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1">
            {movie.title}
          </h3>
          {movie.vote_average > 0 && (
            <div className="flex items-center gap-1 text-xs text-zinc-400">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span>{movie.vote_average.toFixed(1)}</span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}
