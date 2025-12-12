"use client";

import { useState, useEffect } from "react";
import { Star, Calendar, Film } from "lucide-react";
import { MovieSearchResult } from "./types";
import { Review, ReviewInsert } from "../../types/database";
import { format } from "date-fns";
import { ja } from "date-fns/locale";

interface ReviewFormProps {
  movie: MovieSearchResult | null;
  existingReview?: Review | null;
  onSave: (review: ReviewInsert) => void;
  onCancel: () => void;
}

const CRITERIA = [
  { key: "plot", label: "ストーリー" },
  { key: "acting", label: "演技" },
  { key: "pacing", label: "テンポ" },
  { key: "cinematography", label: "映像美" },
  { key: "writing", label: "脚本" },
  { key: "ending", label: "エンディング" },
] as const;

const PLATFORMS = [
  "Netflix",
  "Amazon Prime Video",
  "Disney+",
  "Hulu",
  "U-NEXT",
  "映画館",
  "その他",
];

export default function ReviewForm({ movie, existingReview, onSave, onCancel }: ReviewFormProps) {
  const [overallRating, setOverallRating] = useState(existingReview?.overall_rating || 5);
  const [criteriaRatings, setCriteriaRatings] = useState(
    existingReview?.criteria_ratings || {
      plot: 5,
      acting: 5,
      pacing: 5,
      cinematography: 5,
      writing: 5,
      ending: 5,
    }
  );
  const [reviewText, setReviewText] = useState(existingReview?.review_text || "");
  const [watchedDate, setWatchedDate] = useState(
    existingReview?.watched_date
      ? format(new Date(existingReview.watched_date), "yyyy-MM-dd")
      : format(new Date(), "yyyy-MM-dd")
  );
  const [platform, setPlatform] = useState(existingReview?.platform || "");

  useEffect(() => {
    if (existingReview) {
      // 既存レビューを編集する場合
      setOverallRating(existingReview.overall_rating);
      setCriteriaRatings(existingReview.criteria_ratings);
      setReviewText(existingReview.review_text || "");
      setWatchedDate(
        existingReview.watched_date
          ? format(new Date(existingReview.watched_date), "yyyy-MM-dd")
          : format(new Date(), "yyyy-MM-dd")
      );
      setPlatform(existingReview.platform || "");
    } else if (movie) {
      // 新しい映画が選択されたらフォームをリセット
      setOverallRating(5);
      setCriteriaRatings({
        plot: 5,
        acting: 5,
        pacing: 5,
        cinematography: 5,
        writing: 5,
        ending: 5,
      });
      setReviewText("");
      setWatchedDate(format(new Date(), "yyyy-MM-dd"));
      setPlatform("");
    }
  }, [movie, existingReview]);

  if (!movie) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const review: ReviewInsert = {
      movie_id: movie.id,
      title: movie.title,
      poster_path: movie.poster_path,
      overall_rating: overallRating,
      criteria_ratings: criteriaRatings,
      review_text: reviewText || null,
      watched_date: watchedDate || null,
      platform: platform || null,
    };

    onSave(review);
  };

  const updateCriteriaRating = (key: keyof typeof criteriaRatings, value: number) => {
    setCriteriaRatings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] p-6">
      <div className="mb-6 flex items-start gap-4">
        {movie.poster_path ? (
          <img
            src={`https://image.tmdb.org/t/p/w154${movie.poster_path}`}
            alt={movie.title}
            className="h-32 w-24 object-cover rounded flex-shrink-0"
          />
        ) : (
          <div className="h-32 w-24 bg-[#2a2a2a] rounded flex items-center justify-center flex-shrink-0">
            <Film className="h-12 w-12 text-gray-600" />
          </div>
        )}
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-white mb-2">{movie.title}</h2>
          {movie.release_date && (
            <p className="text-sm text-gray-400 mb-4">{movie.release_date}</p>
          )}
          {movie.overview && (
            <div className="mt-4">
              <h3 className="text-sm font-semibold text-[#D4AF37] mb-2">あらすじ</h3>
              <p className="text-sm text-gray-300 leading-relaxed max-h-32 overflow-y-auto">
                {movie.overview}
              </p>
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 総合評価 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            総合評価
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <button
                key={rating}
                type="button"
                onClick={() => setOverallRating(rating)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    rating <= overallRating
                      ? "fill-[#D4AF37] text-[#D4AF37]"
                      : "text-gray-600"
                  }`}
                />
              </button>
            ))}
            <span className="ml-4 text-lg font-semibold text-[#D4AF37]">
              {overallRating}/5
            </span>
          </div>
        </div>

        {/* 各項目の評価（スライダー） */}
        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-300 mb-3">
            詳細評価（1-10点）
          </label>
          {CRITERIA.map((criterion) => (
            <div key={criterion.key}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300">{criterion.label}</span>
                <span className="text-sm font-semibold text-[#D4AF37]">
                  {criteriaRatings[criterion.key]}/10
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="10"
                value={criteriaRatings[criterion.key]}
                onChange={(e) =>
                  updateCriteriaRating(criterion.key, parseInt(e.target.value))
                }
                className="w-full h-2 bg-[#1a1a1a] rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
              />
            </div>
          ))}
        </div>

        {/* 視聴日 */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            <Calendar className="inline h-4 w-4 mr-1" />
            視聴日
          </label>
          <input
            type="date"
            value={watchedDate}
            onChange={(e) => setWatchedDate(e.target.value)}
            className="w-full rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
          />
        </div>

        {/* プラットフォーム */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            視聴プラットフォーム
          </label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value)}
            className="w-full rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-2 text-white focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20"
          >
            <option value="">選択してください</option>
            {PLATFORMS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* レビューテキスト */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            レビュー本文
          </label>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            rows={6}
            placeholder="この映画についての感想を書いてください..."
            className="w-full rounded-lg border border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-white placeholder-gray-500 focus:border-[#D4AF37] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/20 resize-none"
          />
        </div>

        {/* ボタン */}
        <div className="flex gap-3">
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
  );
}
