"use client";

import { Star, Film, Edit2, Trash2 } from "lucide-react";
import { Review } from "@/types/movie";
import { getPosterUrl } from "@/lib/tmdb";

interface ReviewListProps {
  reviews: Review[];
  onEdit: (review: Review) => void;
  onDelete: (reviewId: string) => void;
}

export default function ReviewList({ reviews, onEdit, onDelete }: ReviewListProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400 text-lg">まだレビューがありません</p>
        <p className="text-gray-500 text-sm mt-2">映画を検索して評価を記録しましょう</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
      {reviews.map((review) => {
        const posterUrl = getPosterUrl(review.movie_poster_path);
        return (
          <div
            key={review.id}
            className="group flex flex-col h-full overflow-hidden rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] hover:border-[#D4AF37]/50 transition-all duration-300"
          >
            {/* 画像エリア */}
            <div className="relative w-full aspect-[2/3] overflow-hidden rounded-t-lg transition-transform duration-500 group-hover:scale-105">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={review.movie_title}
                  className="object-cover w-full h-full transition-transform duration-500"
                />
              ) : (
                <div className="w-full h-full bg-[#2a2a2a] flex flex-col items-center justify-center">
                  <Film className="h-8 w-8 text-gray-600 mb-2" />
                  <p className="text-xs text-gray-500 text-center px-2 line-clamp-2">
                    {review.movie_title}
                  </p>
                </div>
              )}

              {/* 星評価バッジ */}
              <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1.5 flex items-center gap-1">
                <Star className="h-4 w-4 fill-[#D4AF37] text-[#D4AF37]" />
                <span className="text-sm font-semibold text-white">
                  {review.overall_star_rating}/5
                </span>
              </div>

              {/* 操作ボタン */}
              <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(review)}
                  className="bg-black/70 backdrop-blur-sm rounded-full p-2 hover:bg-black/90 transition-colors"
                  title="編集"
                >
                  <Edit2 className="h-4 w-4 text-white" />
                </button>
                <button
                  onClick={() => {
                    if (confirm("このレビューを削除しますか？")) {
                      onDelete(review.id);
                    }
                  }}
                  className="bg-black/70 backdrop-blur-sm rounded-full p-2 hover:bg-red-500/90 transition-colors"
                  title="削除"
                >
                  <Trash2 className="h-4 w-4 text-white" />
                </button>
              </div>
            </div>

            {/* テキストエリア */}
            <div className="flex-1 p-4 flex flex-col">
              <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                {review.movie_title}
              </h3>

              {review.movie_release_date && (
                <p className="text-xs text-gray-500 mb-3">
                  {new Date(review.movie_release_date).getFullYear()}
                </p>
              )}

              {/* 評価項目の表示 */}
              <div className="space-y-1 mb-3">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">ストーリー</span>
                  <span className="text-[#D4AF37]">{review.ratings.story}/10</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">演技</span>
                  <span className="text-[#D4AF37]">{review.ratings.acting}/10</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">演出</span>
                  <span className="text-[#D4AF37]">{review.ratings.direction}/10</span>
                </div>
              </div>

              {review.comment && (
                <p className="text-sm text-gray-300 line-clamp-3 mt-auto">
                  {review.comment}
                </p>
              )}

              <p className="text-xs text-gray-500 mt-3">
                {new Date(review.created_at).toLocaleDateString("ja-JP")}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
