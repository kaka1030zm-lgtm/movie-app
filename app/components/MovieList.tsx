"use client";

import { useState } from "react";
import { Edit, Trash2, Plus, Film } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { ReviewRecord, WatchlistItem } from "./types";

interface MovieListProps {
  reviews: ReviewRecord[];
  watchlist: WatchlistItem[];
  activeTab: "reviews" | "watchlist";
  onEditReview: (review: ReviewRecord) => void;
  onDeleteReview: (id: string) => void;
  onRemoveFromWatchlist: (id: number) => void;
  onAddReview: (movie: WatchlistItem) => void;
}

export default function MovieList({
  reviews,
  watchlist,
  activeTab,
  onEditReview,
  onDeleteReview,
  onRemoveFromWatchlist,
  onAddReview,
}: MovieListProps) {
  const { t } = useTranslation();
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);

  const items = activeTab === "reviews" ? reviews : watchlist;

  const handleDeleteClick = (id: string | number) => {
    setDeleteConfirmId(id);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmId === null) return;
    if (activeTab === "reviews") {
      onDeleteReview(deleteConfirmId as string);
    } else {
      onRemoveFromWatchlist(deleteConfirmId as number);
    }
    setDeleteConfirmId(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <Film className="mb-4 h-12 w-12 text-zinc-700" />
        <p className="text-zinc-400">
          {activeTab === "reviews" ? t.noReviews : t.noWatchlist}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeTab === "reviews" ? (
        reviews.map((review) => (
          <div
            key={review.id}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-500 premium-hover"
          >
            <div className="flex gap-5 p-5">
              {review.posterPath ? (
                <div className="relative h-36 w-28 flex-shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                  <img
                    src={`https://image.tmdb.org/t/p/w154${review.posterPath}`}
                    alt={review.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-36 w-28 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/10">
                  <Film className="h-10 w-10 text-white/10" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-1">{review.title}</h3>
                    <p className="text-sm text-white/50 font-medium">{review.releaseDate}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEditReview(review)}
                      className="rounded-xl p-2.5 text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300 border border-white/10 hover:border-white/20"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(review.id)}
                      className="rounded-xl p-2.5 text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 border border-white/10 hover:border-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mb-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-white/70 font-medium">
                    {t.story}: {review.story}/5
                  </span>
                  <span className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-white/70 font-medium">
                    {t.acting}: {review.acting}/5
                  </span>
                  <span className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-white/70 font-medium">
                    {t.visuals}: {review.visuals}/5
                  </span>
                  <span className="rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-white/70 font-medium">
                    {t.music}: {review.music}/5
                  </span>
                </div>
                {review.reviewBody && (
                  <p className="line-clamp-2 text-sm text-white/60 leading-relaxed">{review.reviewBody}</p>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        watchlist.map((item) => (
          <div
            key={item.id}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm transition-all duration-500 premium-hover"
          >
            <div className="flex gap-5 p-5">
              {item.posterPath ? (
                <div className="relative h-36 w-28 flex-shrink-0 rounded-xl overflow-hidden border border-white/10 shadow-lg">
                  <img
                    src={`https://image.tmdb.org/t/p/w154${item.posterPath}`}
                    alt={item.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="flex h-36 w-28 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/10">
                  <Film className="h-10 w-10 text-white/10" />
                </div>
              )}
              <div className="flex flex-1 items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-white mb-1">{item.title}</h3>
                  <p className="text-sm text-white/50 font-medium">{item.releaseDate}</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => onAddReview(item)}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f4d03f] px-5 py-2.5 text-sm font-semibold text-black transition-all duration-300 hover:from-[#f4d03f] hover:to-[#d4af37] shadow-lg shadow-[#d4af37]/20 hover:shadow-[#d4af37]/30 hover:scale-105"
                  >
                    <Plus className="h-4 w-4" />
                    {t.writeReview}
                  </button>
                  <button
                    onClick={() => handleDeleteClick(item.id)}
                    className="rounded-xl p-2.5 text-white/50 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 border border-white/10 hover:border-red-500/20"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))
      )}

      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
          <div className="w-full max-w-md rounded-3xl glass shadow-2xl p-8 scale-in">
            <h3 className="mb-6 text-xl font-bold text-white">
              {activeTab === "reviews" ? t.confirmDeleteReview : t.confirmDeleteWatchlist}
            </h3>
            <div className="flex gap-4">
              <button
                onClick={handleDeleteCancel}
                className="flex-1 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 font-semibold text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 rounded-xl bg-red-500/90 px-6 py-3.5 font-semibold text-white transition-all duration-300 hover:bg-red-500 hover:scale-105 shadow-lg shadow-red-500/20"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

