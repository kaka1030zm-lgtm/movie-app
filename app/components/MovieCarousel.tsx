"use client";

import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Film } from "lucide-react";
import { MovieSearchResult } from "@/types/movie";
import { getPosterUrl } from "@/lib/tmdb";

interface MovieCarouselProps {
  movies: MovieSearchResult[];
  onMovieSelect: (movie: MovieSearchResult) => void;
  title: string;
}

export default function MovieCarousel({
  movies,
  onMovieSelect,
  title,
}: MovieCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.8;
    const newScrollLeft =
      direction === "left"
        ? scrollRef.current.scrollLeft - scrollAmount
        : scrollRef.current.scrollLeft + scrollAmount;
    
    scrollRef.current.scrollTo({
      left: newScrollLeft,
      behavior: "smooth",
    });
  };

  if (movies.length === 0) return null;

  return (
    <div className="relative mb-12">
      <h3 className="text-2xl font-bold text-white mb-6">{title}</h3>
      
      <div className="relative group">
        {/* 左矢印 */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 backdrop-blur-sm border border-[#D4AF37]/30 rounded-full p-3 hover:bg-[#D4AF37]/20 hover:border-[#D4AF37] transition-all duration-300 opacity-0 group-hover:opacity-100"
            aria-label="前へ"
          >
            <ChevronLeft className="h-6 w-6 text-[#D4AF37]" />
          </button>
        )}

        {/* スライドコンテナ */}
        <div
          ref={scrollRef}
          onScroll={checkScrollability}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {movies.map((movie) => {
            const posterUrl = getPosterUrl(movie.poster_path);
            return (
              <button
                key={movie.id}
                onClick={() => onMovieSelect(movie)}
                className="flex-shrink-0 w-32 sm:w-40 group/movie"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] transition-all duration-300 group-hover/movie:scale-105 group-hover/movie:border-[#D4AF37]/50">
                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={movie.title}
                      className="object-cover w-full h-full transition-transform duration-300"
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
                    <Film className="h-8 w-8 text-gray-600 mb-2" />
                    <p className="text-xs text-gray-500 text-center px-2 line-clamp-2">
                      {movie.title}
                    </p>
                  </div>
                </div>
                <h4 className="text-sm font-medium text-white mt-2 line-clamp-2 text-left">
                  {movie.title}
                </h4>
                {movie.release_date && (
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(movie.release_date).getFullYear()}
                  </p>
                )}
              </button>
            );
          })}
        </div>

        {/* 右矢印 */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-black/70 backdrop-blur-sm border border-[#D4AF37]/30 rounded-full p-3 hover:bg-[#D4AF37]/20 hover:border-[#D4AF37] transition-all duration-300 opacity-0 group-hover:opacity-100"
            aria-label="次へ"
          >
            <ChevronRight className="h-6 w-6 text-[#D4AF37]" />
          </button>
        )}
      </div>
    </div>
  );
}
