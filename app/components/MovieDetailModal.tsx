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
      className={`fixed inset-0 z-[70] bg-black/80 transition-opacity duration-300 ${
        isVisible ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleBackdropClick}
    >
      <div
        className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-5xl w-[95%] max-h-[95vh] rounded-lg bg-zinc-900 shadow-xl overflow-hidden transition-all duration-300 ${
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 閉じるボタン */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-[80] text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        {/* ローディング状態 */}
        {isLoading && (
          <div className="flex items-center justify-center min-h-full py-20">
            <div className="text-center">
              <div className="mb-4 inline-block h-12 w-12 animate-spin rounded-full border-4 border-gray-700 border-t-amber-400"></div>
              <p className="text-gray-400">{t.processing}</p>
            </div>
          </div>
        )}

        {/* コンテンツ */}
        {!isLoading && (
          <div className="flex flex-col md:flex-row">
            {/* 左側: ポスター、タイトル、評価（40%） */}
            <div className="w-full md:w-2/5 flex flex-col items-start p-8 space-y-4">
              {movie.poster_path ? (
                <img
                  src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                  alt={movie.title || movie.name}
                  className="aspect-[2/3] object-cover w-full rounded-lg shadow-2xl"
                />
              ) : (
                <div className="flex aspect-[2/3] w-full items-center justify-center rounded-lg bg-zinc-800">
                  <span className="text-6xl">🎬</span>
                </div>
              )}

              <h2 className="text-4xl font-extrabold mt-4 text-white">
                {movie.title || movie.name}
              </h2>

              {movie.original_title && movie.original_title !== movie.title && (
                <p className="text-lg text-gray-400">{movie.original_title}</p>
              )}

              <div className="flex items-center space-x-4 text-lg text-yellow-500">
                {movie.vote_average > 0 && (
                  <div className="flex items-center gap-1">
                    <Star className="h-6 w-6 fill-yellow-500 text-yellow-500" />
                    <span className="font-semibold">{movie.vote_average.toFixed(1)}</span>
                  </div>
                )}
                <span className="text-gray-400">
                  {movie.release_date || movie.first_air_date}
                </span>
              </div>
            </div>

            {/* 右側: 詳細情報（60%） */}
            <div className="w-full md:w-3/5 p-8 space-y-8 overflow-y-auto">
              {/* 概要 */}
              <div>
                <h3 className="text-2xl font-bold border-b border-gray-700 pb-2 mb-4 text-white">
                  概要
                </h3>
                <p className="text-base leading-relaxed text-gray-300">
                  {movieDetails?.overview || movie.overview || t.noOverview}
                </p>
              </div>

              {/* ジャンル */}
              {movieDetails?.genres && movieDetails.genres.length > 0 && (
                <div>
                  <h3 className="text-2xl font-bold border-b border-gray-700 pb-2 mb-4 text-white">
                    ジャンル
                  </h3>
                  <div className="flex flex-wrap gap-2 mt-4">
                    {movieDetails.genres.map((genre: any) => (
                      <span
                        key={genre.id}
                        className="px-3 py-1 text-sm bg-yellow-600/30 text-yellow-300 rounded-full font-medium"
                      >
                        {genre.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* その他の情報 */}
              {movieDetails && (
                <div className="grid grid-cols-2 gap-x-6 gap-y-4 text-base mt-6">
                  {movieDetails.release_date && (
                    <>
                      <div className="text-gray-400">公開日</div>
                      <div className="text-gray-300">{movieDetails.release_date || movieDetails.first_air_date}</div>
                    </>
                  )}
                  {movieDetails.runtime && (
                    <>
                      <div className="text-gray-400">上映時間</div>
                      <div className="text-gray-300">{movieDetails.runtime}分</div>
                    </>
                  )}
                  {movieDetails.original_language && (
                    <>
                      <div className="text-gray-400">言語</div>
                      <div className="text-gray-300">{movieDetails.original_language.toUpperCase()}</div>
                    </>
                  )}
                </div>
              )}

              {/* アクションボタン */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleWatchlistToggle}
                  className={`flex items-center gap-2 rounded-lg px-6 py-3 font-medium transition-colors duration-200 ${
                    isInWatchlist
                      ? "border border-zinc-700 bg-zinc-800 text-white hover:bg-zinc-700"
                      : "bg-amber-400 text-black hover:bg-amber-300"
                  }`}
                >
                  <Plus className="h-5 w-5" />
                  {isInWatchlist ? t.removeFromWatchlist : t.addToWatchlist}
                </button>
                <button
                  onClick={() => setShowReviewForm(true)}
                  className="rounded-lg border border-zinc-700 bg-zinc-800 px-6 py-3 font-medium text-white transition-colors duration-200 hover:bg-zinc-700"
                >
                  {existingReview ? t.editReview : t.writeReview}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* レビューフォーム（モーダル内に表示） */}
        {showReviewForm && movie && (
          <div className="absolute inset-0 bg-zinc-900 rounded-lg overflow-y-auto">
            <div className="p-6">
              <button
                onClick={() => setShowReviewForm(false)}
                className="absolute right-4 top-4 rounded-full p-2 text-gray-400 transition-colors hover:bg-zinc-800 hover:text-white"
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

