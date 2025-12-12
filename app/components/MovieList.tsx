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
            className="group relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 transition-all hover:border-zinc-700"
          >
            <div className="flex gap-4 p-4">
              {review.posterPath ? (
                <img
                  src={`https://image.tmdb.org/t/p/w154${review.posterPath}`}
                  alt={review.title}
                  className="h-32 w-24 flex-shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex h-32 w-24 flex-shrink-0 items-center justify-center rounded bg-zinc-800">
                  <Film className="h-8 w-8 text-zinc-600" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{review.title}</h3>
                    <p className="text-sm text-zinc-400">{review.releaseDate}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onEditReview(review)}
                      className="rounded p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(review.id)}
                      className="rounded p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-red-400"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="mb-2 flex flex-wrap gap-2 text-xs">
                  <span className="rounded bg-zinc-800 px-2 py-1 text-zinc-300">
                    {t.story}: {review.story}/5
                  </span>
                  <span className="rounded bg-zinc-800 px-2 py-1 text-zinc-300">
                    {t.acting}: {review.acting}/5
                  </span>
                  <span className="rounded bg-zinc-800 px-2 py-1 text-zinc-300">
                    {t.visuals}: {review.visuals}/5
                  </span>
                  <span className="rounded bg-zinc-800 px-2 py-1 text-zinc-300">
                    {t.music}: {review.music}/5
                  </span>
                </div>
                {review.reviewBody && (
                  <p className="line-clamp-2 text-sm text-zinc-300">{review.reviewBody}</p>
                )}
              </div>
            </div>
          </div>
        ))
      ) : (
        watchlist.map((item) => (
          <div
            key={item.id}
            className="group relative overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900/50 transition-all hover:border-zinc-700"
          >
            <div className="flex gap-4 p-4">
              {item.posterPath ? (
                <img
                  src={`https://image.tmdb.org/t/p/w154${item.posterPath}`}
                  alt={item.title}
                  className="h-32 w-24 flex-shrink-0 rounded object-cover"
                />
              ) : (
                <div className="flex h-32 w-24 flex-shrink-0 items-center justify-center rounded bg-zinc-800">
                  <Film className="h-8 w-8 text-zinc-600" />
                </div>
              )}
              <div className="flex flex-1 items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="text-sm text-zinc-400">{item.releaseDate}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAddReview(item)}
                    className="flex items-center gap-2 rounded-lg bg-amber-400 px-4 py-2 text-sm font-medium text-black transition-colors hover:bg-amber-300"
                  >
                    <Plus className="h-4 w-4" />
                    {t.writeReview}
                  </button>
                  <button
                    onClick={() => handleDeleteClick(item.id)}
                    className="rounded p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-red-400"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-md rounded-lg border border-zinc-800 bg-zinc-900 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              {activeTab === "reviews" ? t.confirmDeleteReview : t.confirmDeleteWatchlist}
            </h3>
            <div className="flex gap-3">
              <button
                onClick={handleDeleteCancel}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-white transition-colors hover:bg-zinc-700"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition-colors hover:bg-red-700"
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

