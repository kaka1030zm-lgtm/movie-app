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
    <div className="group relative overflow-hidden rounded-2xl bg-[#141414] border border-white/5 transition-all duration-300 hover:scale-105 animate-in fade-in">
      <button
        onClick={onClick}
        className="w-full text-left"
      >
        <div className="aspect-[2/3] w-full relative overflow-hidden rounded-t-2xl">
          {movie.poster_path ? (
            <>
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title || movie.name}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a]">
              <Film className="h-16 w-16 text-white/10" />
            </div>
          )}
          
          {/* ブックマークアイコン（右上） */}
          {onToggleWatchlist && (
            <button
              onClick={handleBookmarkClick}
              disabled={isWatchlistLoading}
              className={`absolute top-3 right-3 z-10 rounded-full p-2.5 backdrop-blur-md transition-all duration-300 ${
                isInWatchlist
                  ? "bg-[#d4af37]/90 text-black hover:bg-[#d4af37] shadow-lg shadow-[#d4af37]/20"
                  : "bg-black/40 text-white/70 hover:bg-black/60 hover:text-[#d4af37] border border-white/10"
              } ${isWatchlistLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-110"}`}
              title={isInWatchlist ? "見たいリストから削除" : "見たいリストに追加"}
            >
              {isWatchlistLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
              ) : (
                <Star className={`h-5 w-5 ${isInWatchlist ? "fill-[#d4af37] text-[#d4af37]" : "text-gray-400"}`} />
              )}
            </button>
          )}
        </div>
        {/* タイトルと評価用のスペース */}
        <div className="h-[70px] p-4 flex flex-col justify-center bg-gradient-to-b from-[#141414] to-[#0a0a0a]">
          <h3 className="text-sm font-semibold text-white/95 line-clamp-2 mb-2 leading-snug group-hover:text-white transition-colors">
            {movie.title || movie.name}
          </h3>
          {movie.vote_average > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-white/50">
              <Star className="h-3.5 w-3.5 fill-[#d4af37] text-[#d4af37]" />
              <span className="font-medium">{movie.vote_average.toFixed(1)}</span>
            </div>
          )}
        </div>
      </button>
    </div>
  );
}
