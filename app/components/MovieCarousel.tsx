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
    <div className="mb-8">
      <h2 className="mb-4 text-2xl font-bold text-yellow-500">{title}</h2>
      <div className="overflow-x-scroll scrollbar-hide scroll-smooth">
        <div className="flex space-x-4 pb-4">
          {movies.map((movie) => (
            <button
              key={movie.id}
              onClick={() => onMovieClick(movie)}
              className="group relative flex-shrink-0 w-40 transition-transform duration-200 hover:scale-105"
            >
              <div className="aspect-[2/3] w-full relative rounded-lg overflow-hidden bg-zinc-900/50">
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
              <div className="mt-2 px-1">
                <h3 className="text-xs font-semibold text-white line-clamp-2 text-left">
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
