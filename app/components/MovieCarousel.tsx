"use client";

import { MovieSearchResult } from "./types";
import { Film } from "lucide-react";

interface MovieCarouselProps {
  title: string;
  movies: MovieSearchResult[];
  onMovieClick: (movie: MovieSearchResult) => void;
}

export default function MovieCarousel({ title, movies, onMovieClick }: MovieCarouselProps) {
  if (!movies || movies.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <h2 className="mb-6 text-2xl font-bold bg-gradient-to-r from-white via-white to-[#d4af37] bg-clip-text text-transparent tracking-tight">
        {title}
      </h2>
      <div className="overflow-x-scroll scrollbar-hide scroll-smooth pb-2">
        <div className="flex space-x-5 pb-4">
          {movies.map((movie) => (
            <button
              key={movie.id}
              onClick={() => onMovieClick(movie)}
              className="group relative flex-shrink-0 w-40 transition-all duration-500 hover:scale-105"
            >
              <div className="aspect-[2/3] w-full relative rounded-xl overflow-hidden bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/5 shadow-lg">
                {movie.poster_path ? (
                  <>
                    <img
                      src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
                      alt={movie.title || movie.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  </>
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <Film className="h-12 w-12 text-white/10" />
                  </div>
                )}
              </div>
              <div className="mt-3 px-1">
                <h3 className="text-xs font-semibold text-white/90 line-clamp-2 text-left group-hover:text-white transition-colors leading-snug">
                  {movie.title || movie.name}
                </h3>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
