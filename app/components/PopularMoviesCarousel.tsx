"use client";

import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Film } from "lucide-react";
import { MovieSearchResult } from "@/types/movie";
import { getPosterUrl } from "@/lib/tmdb";

interface PopularMoviesCarouselProps {
  movies: MovieSearchResult[];
  onMovieSelect: (movie: MovieSearchResult, event?: React.MouseEvent) => void;
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
    <div className="relative overflow-visible">
      <div className="mb-6 flex items-center gap-3">
        <h3 className="text-xl font-semibold text-white/90">
          {title || "人気の映画"}
        </h3>
      </div>

      <div className="relative group overflow-visible">
        {/* 左矢印 - ポスターの中心の高さに配置 */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            onMouseEnter={() => checkScrollability()}
            className="absolute z-20 bg-gradient-to-r from-black/90 via-black/80 to-transparent backdrop-blur-md border border-[#D4AF37]/40 rounded-full p-4 hover:bg-gradient-to-r hover:from-[#D4AF37]/20 hover:via-[#D4AF37]/10 hover:to-transparent hover:border-[#D4AF37] transition-all duration-500 shadow-lg shadow-[#D4AF37]/20 opacity-0 group-hover:opacity-100 left-0 sm:-left-4"
            style={{ 
              top: 'calc(2rem + (10rem * 1.5) / 2)',
              transform: 'translateY(-50%)'
            }}
            aria-label="前へ"
          >
            <ChevronLeft className="h-7 w-7 text-[#D4AF37] drop-shadow-lg" />
          </button>
        )}

        {/* スライドコンテナ */}
        <div
          ref={scrollRef}
          onScroll={checkScrollability}
          className="flex gap-4 overflow-x-auto overflow-y-visible scrollbar-hide scroll-smooth py-8 px-4 -mx-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {movies.map((movie, index) => {
            const posterUrl = getPosterUrl(movie.poster_path);
            return (
              <div
                key={movie.id}
                className="flex-shrink-0 w-40 sm:w-48 group/movie transition-all duration-300 cursor-pointer"
                style={{ transform: "translateZ(0)" }}
                onClick={(e) => onMovieSelect(movie, e)}
              >
                <div className="transition-all duration-200 group-hover/movie:scale-110 group-hover/movie:z-10">
                  <div 
                    className="relative aspect-[2/3] overflow-hidden rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] group-hover/movie:border-[#D4AF37]/60 group-hover/movie:shadow-xl group-hover/movie:shadow-[#D4AF37]/20"
                  >
                    {/* ランキングバッジ - 高級感のある小さなラベル（あなたへのおすすめ以外） */}
                    {title && !title.includes("あなたへのおすすめ") && (
                      <div className="absolute top-1.5 left-1.5 z-10">
                        <div className="px-1.5 py-0.5 bg-black/70 backdrop-blur-sm border border-[#D4AF37]/40 rounded text-[10px] font-semibold text-[#D4AF37] tracking-tight">
                          #{index + 1}
                        </div>
                      </div>
                    )}

                    {posterUrl ? (
                      <img
                        src={posterUrl}
                        alt={movie.title}
                        className="object-cover w-full h-full"
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
                  {/* タイトルと年号バッジ */}
                  <div className="mt-3 flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm sm:text-base font-semibold text-white line-clamp-2 flex-1 min-w-0">
                      {movie.title}
                    </h4>
                    {movie.release_date && (
                      <span className="px-2.5 py-1 bg-gray-600/70 text-gray-200 text-xs font-medium rounded-full flex-shrink-0 whitespace-nowrap">
                        {new Date(movie.release_date).getFullYear()}
                      </span>
                    )}
                  </div>
                  {/* あらすじ */}
                  {movie.overview && (
                    <p className="mt-2 text-xs text-gray-400 line-clamp-2 leading-relaxed">
                      {movie.overview}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* 右矢印 - ポスターの外側（横）に配置 */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            onMouseEnter={() => checkScrollability()}
            className="absolute z-20 bg-gradient-to-l from-black/90 via-black/80 to-transparent backdrop-blur-md border border-[#D4AF37]/40 rounded-full p-4 hover:bg-gradient-to-l hover:from-[#D4AF37]/20 hover:via-[#D4AF37]/10 hover:to-transparent hover:border-[#D4AF37] transition-all duration-500 shadow-lg shadow-[#D4AF37]/20 opacity-0 group-hover:opacity-100 -right-12 sm:-right-16"
            style={{ 
              top: 'calc(2rem + 8px + (10rem * 1.5) / 2)',
              transform: 'translateY(-50%)'
            }}
            aria-label="次へ"
          >
            <ChevronRight className="h-7 w-7 text-[#D4AF37] drop-shadow-lg sm:h-8 sm:w-8" />
          </button>
        )}
      </div>
    </div>
  );
}


