"use client";

import { MovieSearchResult } from "./types";
import { Star, Film } from "lucide-react";

interface MovieCardProps {
  movie: MovieSearchResult;
  onClick: () => void;
  isLoading?: boolean;
}

export default function MovieCard({ movie, onClick, isLoading }: MovieCardProps) {
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

  return (
    <button
      onClick={onClick}
      className="group relative overflow-hidden rounded-lg bg-zinc-900/50 transition-transform duration-200 hover:scale-[1.03] hover:shadow-xl hover:shadow-amber-400/10 animate-in fade-in"
    >
      <div className="aspect-[2/3] w-full relative">
        {movie.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
            alt={movie.title || movie.name}
            className="h-full w-full object-cover rounded-lg"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-zinc-800 rounded-lg">
            <Film className="h-12 w-12 text-zinc-600" />
          </div>
        )}
      </div>
      {/* タイトルと評価用のスペース（高さ60px程度） */}
      <div className="h-[60px] p-3 flex flex-col justify-center">
        <h3 className="text-sm font-semibold text-white line-clamp-2 mb-1">
          {movie.title || movie.name}
        </h3>
        {movie.vote_average > 0 && (
          <div className="flex items-center gap-1 text-xs text-zinc-400">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            <span>{movie.vote_average.toFixed(1)}</span>
          </div>
        )}
      </div>
    </button>
  );
}
