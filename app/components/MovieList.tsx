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

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

// ポスターURLを生成する関数
const getPosterUrl = (posterPath: string | null | undefined): string | null => {
  if (!posterPath || posterPath.trim() === "") {
    return null;
  }
  if (posterPath.startsWith("http://") || posterPath.startsWith("https://")) {
    return posterPath;
  }
  return `${TMDB_IMAGE_BASE}${posterPath}`;
};

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
      {reviews.map((review) => {
        const posterUrl = getPosterUrl(review.poster_path);
        return (
          <div
            key={review.id}
            className="group flex flex-col h-full overflow-hidden rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] hover:border-[#D4AF37]/50 transition-all"
          >
            {/* 画像エリア */}
            <div className="relative w-full aspect-[2/3] overflow-hidden">
              {posterUrl ? (
                <img
                  src={posterUrl}
                  alt={review.title}
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
                <Film className="h-12 w-12 text-gray-600 mb-2" />
                <p className="text-xs text-gray-500 text-center px-2 line-clamp-2">
                  {review.title}
                </p>
              </div>
            </div>

            {/* テキストエリア */}
            <div className="flex-1 p-4 flex flex-col">
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
                <p className="text-sm text-gray-300 line-clamp-3 mb-3 leading-relaxed">
                  {review.review_text}
                </p>
              )}

              {/* メタ情報 */}
              <div className="flex items-center gap-4 text-xs text-gray-500 mt-auto">
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
        );
      })}
    </div>
  );
}
