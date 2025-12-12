"use client";

import { useState, useEffect } from "react";
import { X, Plus, Star } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { MovieSearchResult, ReviewRecord } from "./types";
import ReviewForm from "./ReviewForm";

interface MovieDetailModalProps {
  movie: MovieSearchResult | null;
  isInWatchlist: boolean;
  existingReview?: ReviewRecord | null;
  onClose: () => void;
  onAddToWatchlist: (movie: MovieSearchResult) => Promise<void>;
  onRemoveFromWatchlist: (movieId: number) => Promise<void>;
  onWriteReview: (movie: MovieSearchResult) => void;
  onSaveReview?: (review: Omit<ReviewRecord, "id" | "createdAt" | "updatedAt">) => void;
}

export default function MovieDetailModal({
  movie,
  isInWatchlist,
  existingReview,
  onClose,
  onAddToWatchlist,
  onRemoveFromWatchlist,
  onWriteReview,
  onSaveReview,
}: MovieDetailModalProps) {
  const { t, apiLang } = useTranslation();
  const [movieDetails, setMovieDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;

  // モーダル表示時のアニメーション
  useEffect(() => {
    if (movie) {
      setIsVisible(true);
      setShowReviewForm(false);
    } else {
      setIsVisible(false);
      setShowReviewForm(false);
    }
  }, [movie]);

  // ESCキーで閉じる
  useEffect(() => {
    if (!movie) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.keyCode === 27) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [movie, onClose]);

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

  const handleWatchlistToggle = async () => {
    if (isInWatchlist) {
      await onRemoveFromWatchlist(movie.id);
    } else {
      await onAddToWatchlist(movie);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[70] bg-black/90 backdrop-blur-xl transition-opacity duration-500 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-5xl w-[95%] max-h-[95vh] rounded-3xl glass shadow-2xl overflow-hidden transition-all duration-500 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-[80] rounded-full p-2.5 text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300 backdrop-blur-sm border border-white/10 hover:border-white/20"
        >
          <X className="h-5 w-5" />
        </button>

        {/* ローディング状態 */}
        {isLoading && (
          <div className="flex items-center justify-center min-h-full py-20">
            <div className="text-center">
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[#d4af37]"></div>
              <p className="text-white/50 font-medium">{t.processing}</p>
            </div>
          </div>
        )}

        {/* コンテンツ */}
        {!isLoading && (
          <div className="flex flex-col md:flex-row">
            {/* 左側: ポスター、タイトル、評価（40%） */}
            <div className="w-full md:w-2/5 flex flex-col items-start p-8 md:p-10 space-y-6">
              {movie.poster_path ? (
                <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                  <img
                    src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                    alt={movie.title || movie.name}
                    className="aspect-[2/3] object-cover w-full"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
                </div>
              ) : (
                <div className="flex aspect-[2/3] w-full items-center justify-center rounded-2xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/10">
                  <span className="text-6xl opacity-20">🎬</span>
                </div>
              )}

              <div className="space-y-3">
                <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight tracking-tight">
                  {movie.title || movie.name}
                </h2>

                {movie.original_title && movie.original_title !== movie.title && (
                  <p className="text-lg text-white/50 font-medium">{movie.original_title}</p>
                )}

                <div className="flex items-center gap-5 text-base">
                  {movie.vote_average > 0 && (
                    <div className="flex items-center gap-2">
                      <Star className="h-6 w-6 fill-[#d4af37] text-[#d4af37]" />
                      <span className="font-bold text-white">{movie.vote_average.toFixed(1)}</span>
                    </div>
                  )}
                  <span className="text-white/40">
                    {movie.release_date || movie.first_air_date}
                  </span>
                </div>
              </div>
            </div>

            {/* 右側: 詳細情報（60%） */}
            <div className="w-full md:w-3/5 p-8 md:p-10 space-y-8 overflow-y-auto">
              {/* 概要 */}
              <div className={`animate-in fade-in ${movieDetails ? "" : "opacity-0"}`}>
                <h3 className="text-xl font-bold pb-3 mb-4 text-white border-b border-white/10">
                  概要
                </h3>
                <p className="text-base leading-relaxed text-white/70 font-light">
                  {movieDetails?.overview || movie.overview || t.noOverview}
                </p>
              </div>

              {/* ジャンル */}
              {movieDetails?.genres && movieDetails.genres.length > 0 && (
                <div className={`animate-in fade-in ${movieDetails ? "" : "opacity-0"}`} style={{ animationDelay: "100ms" }}>
                  <h3 className="text-xl font-bold pb-3 mb-4 text-white border-b border-white/10">
                    ジャンル
                  </h3>
                  <div className="flex flex-wrap gap-2.5 mt-4">
                    {movieDetails.genres.map((genre: any) => (
                      <span
                        key={genre.id}
                        className="px-4 py-1.5 text-sm bg-[#d4af37]/20 text-[#d4af37] rounded-full font-medium border border-[#d4af37]/30"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* その他の情報 */}
              {movieDetails && (
                <div className={`grid grid-cols-2 gap-x-8 gap-y-4 text-sm mt-6 animate-in fade-in ${movieDetails ? "" : "opacity-0"}`} style={{ animationDelay: "200ms" }}>
                  {movieDetails.release_date && (
                    <>
                      <div className="text-white/40 font-medium">公開日</div>
                      <div className="text-white/80">{movieDetails.release_date || movieDetails.first_air_date}</div>
                    </>
                  )}
                  {movieDetails.runtime && (
                    <>
                      <div className="text-white/40 font-medium">上映時間</div>
                      <div className="text-white/80">{movieDetails.runtime}分</div>
                    </>
                  )}
                  {movieDetails.original_language && (
                    <>
                      <div className="text-white/40 font-medium">言語</div>
                      <div className="text-white/80">{movieDetails.original_language.toUpperCase()}</div>
                    </>
                  )}
                </div>
              )}

              {/* アクションボタン */}
              <div className="flex gap-3 pt-6">
                <button
                  onClick={handleWatchlistToggle}
                  className={`flex items-center gap-2.5 rounded-xl px-6 py-3.5 font-semibold transition-all duration-300 ${
                    isInWatchlist
                      ? "border border-white/20 bg-white/5 text-white hover:bg-white/10 hover:border-white/30"
                      : "bg-gradient-to-r from-[#d4af37] to-[#f4d03f] text-black hover:from-[#f4d03f] hover:to-[#d4af37] shadow-lg shadow-[#d4af37]/20 hover:shadow-[#d4af37]/30 hover:scale-105"
                  }`}
                >
                  <Plus className="h-5 w-5" />
                  {isInWatchlist ? t.removeFromWatchlist : t.addToWatchlist}
                </button>
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 font-semibold text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300 hover:scale-105"
                >
                  {existingReview ? t.editReview : t.writeReview}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* レビューフォーム（モーダル内に表示） */}
        {showReviewForm && movie && (
          <div className="absolute inset-0 bg-[#1A1A1A] rounded-3xl overflow-y-auto transition-all duration-500 opacity-0 animate-in fade-in">
            <div className="p-8">
              <button
                onClick={() => setShowReviewForm(false)}
                className="absolute top-5 right-5 z-[80] rounded-full p-2.5 text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300 backdrop-blur-sm border border-white/10 hover:border-white/20"
              >
                <X className="h-5 w-5" />
              </button>
              <ReviewForm
                movie={movie}
                existingReview={existingReview || null}
                onClose={() => setShowReviewForm(false)}
                onSave={(review) => {
                  if (onSaveReview) {
                    onSaveReview(review);
                  }
                  setShowReviewForm(false);
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

