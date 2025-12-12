"use client";

import { useState, useEffect } from "react";
import { Star, X, Film } from "lucide-react";
import { MovieSearchResult, RatingCriteria, ReviewInput } from "@/types/movie";
import { getPosterUrl } from "@/lib/tmdb";
import { calculateOverallRating, convertToStarRating } from "@/lib/reviews";

interface RatingFormProps {
  movie: MovieSearchResult | null;
  existingReview?: {
    ratings: RatingCriteria;
    comment: string | null;
  } | null;
  onSave: (review: ReviewInput) => void;
  onCancel: () => void;
}

const RATING_CRITERIA = [
  { key: "story" as const, label: "ストーリー" },
  { key: "acting" as const, label: "演技" },
  { key: "direction" as const, label: "演出" },
  { key: "cinematography" as const, label: "映像美" },
  { key: "music" as const, label: "音楽" },
] as const;

export default function RatingForm({
  movie,
  existingReview,
  onSave,
  onCancel,
}: RatingFormProps) {
  const [ratings, setRatings] = useState<RatingCriteria>({
    story: 5,
    acting: 5,
    direction: 5,
    cinematography: 5,
    music: 5,
    overall: 5,
  });
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (existingReview) {
      setRatings(existingReview.ratings);
      setComment(existingReview.comment || "");
    } else {
      setRatings({
        story: 5,
        acting: 5,
        direction: 5,
        cinematography: 5,
        music: 5,
        overall: 5,
      });
      setComment("");
    }
  }, [existingReview, movie]);

  if (!movie) return null;

  const updateRating = (key: keyof RatingCriteria, value: number) => {
    const newRatings = { ...ratings, [key]: value };
    const overall = calculateOverallRating(newRatings);
    setRatings({ ...newRatings, overall });
  };

  const overallRating = calculateOverallRating(ratings);
  const starRating = convertToStarRating(overallRating);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const reviewInput: ReviewInput = {
      movie_id: movie.id,
      movie_title: movie.title,
      movie_poster_path: movie.poster_path,
      movie_release_date: movie.release_date,
      ratings: { ...ratings, overall: overallRating },
      comment: comment.trim() || null,
    };

    onSave(reviewInput);
  };

  const posterUrl = getPosterUrl(movie.poster_path);

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-[#0a0a0a] border-b border-[#1a1a1a] p-6 flex items-start justify-between">
          <div className="flex items-start gap-4 flex-1">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={movie.title}
                className="w-20 h-30 object-cover rounded-lg flex-shrink-0"
              />
            ) : (
              <div className="w-20 h-30 bg-[#2a2a2a] rounded-lg flex items-center justify-center flex-shrink-0">
                <Film className="h-8 w-8 text-gray-600" />
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-white mb-1">{movie.title}</h2>
              {movie.release_date && (
                <p className="text-sm text-gray-400 mb-2">
                  {new Date(movie.release_date).getFullYear()}
                </p>
              )}
              {movie.overview && (
                <p className="text-sm text-gray-300 line-clamp-3">{movie.overview}</p>
              )}
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-white transition-colors ml-4"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* 総合評価（星表示） */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-4">
              総合評価
            </label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-8 w-8 ${
                      star <= starRating
                        ? "fill-[#D4AF37] text-[#D4AF37]"
                        : "text-gray-600"
                    }`}
                  />
                ))}
              </div>
              <span className="text-lg font-semibold text-[#D4AF37] ml-4">
                {starRating}/5 ({overallRating}/10)
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              ※ 各項目の平均値から自動計算されます
            </p>
          </div>

          {/* 各項目の評価（スライダー） */}
          <div className="space-y-6">
            <label className="block text-sm font-medium text-gray-300">
              詳細評価（1-10点）
            </label>
            {RATING_CRITERIA.map((criterion) => (
              <div key={criterion.key}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">{criterion.label}</span>
                  <span className="text-sm font-semibold text-[#D4AF37]">
                    {ratings[criterion.key]}/10
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={ratings[criterion.key]}
                  onChange={(e) =>
                    updateRating(criterion.key, parseInt(e.target.value))
                  }
                  className="w-full h-2 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                />
              </div>
            ))}
          </div>

          {/* コメント */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              コメント
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={6}
              placeholder="この映画についての感想を書いてください..."
              className="w-full rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 resize-none"
            />
          </div>

          {/* ボタン */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-white hover:bg-[#1a1a1a] transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-[#D4AF37] px-4 py-3 text-black font-semibold hover:bg-[#B8941F] transition-colors"
            >
              保存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
