"use client";

import { Review } from "../../types/database";
import { format } from "date-fns";
import { ja } from "date-fns/locale";
import { Star, Calendar, Film } from "lucide-react";

interface MovieListProps {
  reviews: Review[];
  onEdit?: (review: Review) => void;
  onDelete?: (reviewId: string) => void;
}

export default function MovieList({ reviews, onEdit, onDelete }: MovieListProps) {
  if (reviews.length === 0) {
    return (
      <div className="text-center py-12">
        <Film className="h-16 w-16 text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">まだレビューがありません</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="group relative rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] overflow-hidden hover:border-[#D4AF37]/50 transition-all"
        >
          {review.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w342${review.poster_path}`}
              alt={review.title}
              className="w-full h-80 object-cover"
            />
          ) : (
            <div className="w-full h-80 bg-[#1a1a1a] flex items-center justify-center">
              <Film className="h-16 w-16 text-gray-600" />
            </div>
          )}

          <div className="p-4">
            <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
              {review.title}
            </h3>

            {/* 総合評価 */}
            <div className="flex items-center gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((rating) => (
                <Star
                  key={rating}
                  className={`h-4 w-4 ${
                    rating <= review.overall_rating
                      ? "fill-[#D4AF37] text-[#D4AF37]"
                      : "text-gray-600"
                  }`}
                />
              ))}
              <span className="ml-2 text-sm text-[#D4AF37] font-medium">
                {review.overall_rating}/5
              </span>
            </div>

            {/* 詳細評価 */}
            <div className="space-y-1 mb-3">
              {Object.entries(review.criteria_ratings).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className="text-gray-400 capitalize">{key}</span>
                  <span className="text-[#D4AF37] font-medium">{value}/10</span>
                </div>
              ))}
            </div>

            {/* レビューテキスト */}
            {review.review_text && (
              <p className="text-sm text-gray-300 line-clamp-2 mb-3">
                {review.review_text}
              </p>
            )}

            {/* メタ情報 */}
            <div className="flex items-center gap-4 text-xs text-gray-500">
              {review.watched_date && (
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {format(new Date(review.watched_date), "yyyy年MM月dd日", {
                    locale: ja,
                  })}
                </div>
              )}
              {review.platform && (
                <span className="truncate">{review.platform}</span>
              )}
            </div>

            {/* アクションボタン */}
            {(onEdit || onDelete) && (
              <div className="mt-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {onEdit && (
                  <button
                    onClick={() => onEdit(review)}
                    className="flex-1 rounded border border-[#1a1a1a] bg-[#0a0a0a] px-3 py-2 text-sm text-white hover:bg-[#1a1a1a] transition-colors"
                  >
                    編集
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => onDelete(review.id)}
                    className="flex-1 rounded border border-red-900 bg-red-900/20 px-3 py-2 text-sm text-red-400 hover:bg-red-900/40 transition-colors"
                  >
                    削除
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
