"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Film } from "lucide-react";
import { MovieSearchResult } from "@/types/movie";
import { getPosterUrl } from "@/lib/tmdb";

interface PopularMoviesCarouselProps {
  movies: MovieSearchResult[];
  onMovieSelect: (movie: MovieSearchResult) => void;
  title?: string;
}

export default function PopularMoviesCarousel({
  movies,
  onMovieSelect,
  title,
}: PopularMoviesCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  useEffect(() => {
    checkScrollability();
    const handleResize = () => checkScrollability();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [movies]);

  const checkScrollability = () => {
    if (!scrollRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  const scroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = scrollRef.current.clientWidth * 0.75;
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
      <h3 className="text-2xl font-bold text-white mb-6">
        {title || "人気の映画 TOP 30"}
      </h3>

      <div className="relative group">
        {/* 左矢印 - 高級感のあるデザイン */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            onMouseEnter={() => checkScrollability()}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-r from-black/90 via-black/80 to-transparent backdrop-blur-md border border-[#D4AF37]/40 rounded-full p-4 hover:bg-gradient-to-r hover:from-[#D4AF37]/20 hover:via-[#D4AF37]/10 hover:to-transparent hover:border-[#D4AF37] transition-all duration-500 shadow-lg shadow-[#D4AF37]/20 opacity-0 group-hover:opacity-100"
            aria-label="前へ"
          >
            <ChevronLeft className="h-7 w-7 text-[#D4AF37] drop-shadow-lg" />
          </button>
        )}

        {/* スライドコンテナ */}
        <div
          ref={scrollRef}
          onScroll={checkScrollability}
          className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {movies.map((movie, index) => {
            const posterUrl = getPosterUrl(movie.poster_path);
            return (
              <button
                key={movie.id}
                onClick={() => onMovieSelect(movie)}
                className="flex-shrink-0 w-28 sm:w-36 group/movie transition-all duration-300"
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] transition-all duration-500 group-hover/movie:scale-110 group-hover/movie:border-[#D4AF37]/60 group-hover/movie:shadow-xl group-hover/movie:shadow-[#D4AF37]/20">
                  {/* ランキングバッジ */}
                  <div className="absolute top-2 left-2 z-10 bg-gradient-to-br from-[#D4AF37] to-[#B8941F] text-black text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                    {index + 1}
                  </div>

                  {posterUrl ? (
                    <img
                      src={posterUrl}
                      alt={movie.title}
                      className="object-cover w-full h-full transition-transform duration-500"
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
                <h4 className="text-xs sm:text-sm font-medium text-white mt-2 line-clamp-2 text-left">
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

        {/* 右矢印 - 高級感のあるデザイン */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            onMouseEnter={() => checkScrollability()}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-20 bg-gradient-to-l from-black/90 via-black/80 to-transparent backdrop-blur-md border border-[#D4AF37]/40 rounded-full p-4 hover:bg-gradient-to-l hover:from-[#D4AF37]/20 hover:via-[#D4AF37]/10 hover:to-transparent hover:border-[#D4AF37] transition-all duration-500 shadow-lg shadow-[#D4AF37]/20 opacity-0 group-hover:opacity-100"
            aria-label="次へ"
          >
            <ChevronRight className="h-7 w-7 text-[#D4AF37] drop-shadow-lg" />
          </button>
        )}
      </div>
    </div>
  );
}
