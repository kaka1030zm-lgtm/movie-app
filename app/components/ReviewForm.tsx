"use client";

import { useState, useEffect } from "react";
import { X, Star } from "lucide-react";
import { useTranslation } from "../hooks/useTranslation";
import { MovieSearchResult, ReviewRecord } from "./types";

interface ReviewFormProps {
  movie: MovieSearchResult | null;
  existingReview?: ReviewRecord | null;
  onSave: (review: Omit<ReviewRecord, "id" | "createdAt" | "updatedAt">) => void;
  onClose: () => void;
  onError?: (error: string) => void;
}

const PLATFORMS = [
  { id: "netflix", name: "Netflix", logo: "/logos/netflix.png" },
  { id: "prime", name: "Amazon Prime", logo: "/logos/prime.png" },
  { id: "disney", name: "Disney+", logo: "/logos/disney.png" },
  { id: "hulu", name: "Hulu", logo: "/logos/hulu.png" },
  { id: "youtube", name: "YouTube", logo: "/logos/youtube.png" },
  { id: "unext", name: "U-NEXT", logo: "/logos/unext.png" },
  { id: "theater", name: "映画館", logo: "/logos/theater.png" },
];

export default function ReviewForm({ movie, existingReview, onSave, onClose, onError }: ReviewFormProps) {
  const { t } = useTranslation();
  const [reviewTitle, setReviewTitle] = useState(existingReview?.reviewTitle || "");
  const [platform, setPlatform] = useState(existingReview?.platform || "");
  const [story, setStory] = useState(existingReview?.story || 0);
  const [acting, setActing] = useState(existingReview?.acting || 0);
  const [visuals, setVisuals] = useState(existingReview?.visuals || 0);
  const [music, setMusic] = useState(existingReview?.music || 0);
  const [originality, setOriginality] = useState(existingReview?.originality || 0);
  const [emotional, setEmotional] = useState(existingReview?.emotional || 0);
  const [reviewBody, setReviewBody] = useState(existingReview?.reviewBody || "");
  const [hoveredRating, setHoveredRating] = useState<{ [key: string]: number }>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (existingReview) {
      setReviewTitle(existingReview.reviewTitle || "");
      setPlatform(existingReview.platform);
      setStory(existingReview.story);
      setActing(existingReview.acting);
      setVisuals(existingReview.visuals);
      setMusic(existingReview.music);
      setOriginality(existingReview.originality);
      setEmotional(existingReview.emotional);
      setReviewBody(existingReview.reviewBody);
    }
  }, [existingReview]);

  // バリデーション
  const validate = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!reviewTitle.trim()) {
      newErrors.reviewTitle = "レビューのタイトルを入力してください";
    }

    if (!reviewBody.trim()) {
      newErrors.reviewBody = "レビュー本文を入力してください";
    }

    if (story === 0 && acting === 0 && visuals === 0 && music === 0 && originality === 0 && emotional === 0) {
      newErrors.rating = "少なくとも1つの評価項目に1つ以上の星を付けてください";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movie) return;

    if (!validate()) {
      if (onError) {
        onError("入力内容を確認してください");
      }
      return;
    }

    setIsSubmitting(true);

    try {
      // 簡易的な認証チェック（localStorageからユーザーIDを取得）
      let userId = "";
      if (typeof window !== "undefined") {
        userId = localStorage.getItem("cinelog_userId") || `user_${Date.now()}`;
        localStorage.setItem("cinelog_userId", userId);
      }

      // APIリクエスト（将来的な実装を考慮）
      // 現在は直接onSaveを呼び出す
      onSave({
        movieId: movie.id,
        title: movie.title || movie.name || "",
        originalTitle: movie.original_title || movie.original_name,
        posterPath: movie.poster_path,
        backdropPath: movie.backdrop_path,
        releaseDate: movie.release_date || movie.first_air_date,
        mediaType: movie.media_type || (movie.name ? "tv" : "movie"),
        platform,
        reviewTitle: reviewTitle.trim(),
        story,
        acting,
        visuals,
        music,
        originality,
        emotional,
        reviewBody: reviewBody.trim(),
        userId,
      });
    } catch (error) {
      console.error("Error saving review:", error);
      if (onError) {
        onError("投稿に失敗しました。時間をおいてお試しください。");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const RatingInput = ({
    label,
    value,
    onChange,
    fieldName,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
    fieldName: string;
  }) => {
    const hoveredValue = hoveredRating[fieldName] || value;

    return (
      <div className="space-y-3">
        <label className="text-sm font-semibold text-white/90">{label}</label>
        <div className="flex items-center gap-3">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(rating)}
              onMouseEnter={() => setHoveredRating({ ...hoveredRating, [fieldName]: rating })}
              onMouseLeave={() => setHoveredRating({ ...hoveredRating, [fieldName]: 0 })}
              className="transition-all duration-300 hover:scale-125 active:scale-95"
            >
              <Star
                className={`h-7 w-7 transition-all duration-300 ${
                  rating <= hoveredValue
                    ? "fill-[#d4af37] text-[#d4af37] drop-shadow-lg"
                    : rating <= value
                    ? "fill-[#d4af37]/80 text-[#d4af37]/80"
                    : "text-white/20"
                }`}
              />
            </button>
          ))}
          <span className="ml-3 text-sm font-semibold text-white/60">{value}/5</span>
        </div>
      </div>
    );
  };

  if (!movie) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl glass shadow-2xl p-8 scale-in">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 rounded-full p-2.5 text-white/50 hover:text-white hover:bg-white/10 transition-all duration-300 backdrop-blur-sm border border-white/10 hover:border-white/20"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-8 flex items-center gap-5 pb-6 border-b border-white/10">
          {movie.poster_path ? (
            <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-lg">
              <img
                src={`https://image.tmdb.org/t/p/w154${movie.poster_path}`}
                alt={movie.title || movie.name}
                className="h-28 w-20 object-cover"
              />
            </div>
          ) : (
            <div className="flex h-28 w-20 items-center justify-center rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#0a0a0a] border border-white/10">
              <span className="text-3xl opacity-20">🎬</span>
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{movie.title || movie.name}</h2>
            <p className="text-sm text-white/50 font-medium">
              {movie.release_date || movie.first_air_date || ""}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* レビュータイトル */}
          <div>
            <label className="mb-3 block text-sm font-semibold text-white/90">
              レビュータイトル <span className="text-[#d4af37]">*</span>
            </label>
            <input
              type="text"
              value={reviewTitle}
              onChange={(e) => {
                setReviewTitle(e.target.value);
                if (errors.reviewTitle) {
                  setErrors({ ...errors, reviewTitle: "" });
                }
              }}
              placeholder="例: 感動的な作品でした"
              className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white placeholder-white/30 focus:border-[#d4af37]/50 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20 focus:bg-white/10 transition-all duration-300"
            />
            {errors.reviewTitle && (
              <p className="mt-2 text-sm text-red-400/80">{errors.reviewTitle}</p>
            )}
          </div>

          <div>
            <label className="mb-3 block text-sm font-semibold text-white/90">
              {t.platform}
            </label>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-7">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id)}
                  className={`flex flex-col items-center gap-2 rounded-xl border p-3 transition-all duration-300 ${
                    platform === p.id
                      ? "border-[#d4af37] bg-[#d4af37]/20 shadow-lg shadow-[#d4af37]/10 scale-105"
                      : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/10"
                  }`}
                >
                  <img src={p.logo} alt={p.name} className="h-6 w-6 object-contain opacity-80" />
                  <span className="text-xs text-white/70 font-medium">{p.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {errors.rating && (
              <p className="text-sm text-red-400">{errors.rating}</p>
            )}
            <RatingInput label={t.story} value={story} onChange={setStory} fieldName="story" />
            <RatingInput label={t.acting} value={acting} onChange={setActing} fieldName="acting" />
            <RatingInput label={t.visuals} value={visuals} onChange={setVisuals} fieldName="visuals" />
            <RatingInput label={t.music} value={music} onChange={setMusic} fieldName="music" />
            <RatingInput
              label={t.originality}
              value={originality}
              onChange={setOriginality}
              fieldName="originality"
            />
            <RatingInput label={t.emotional} value={emotional} onChange={setEmotional} fieldName="emotional" />
          </div>

          <div>
            <label className="mb-3 block text-sm font-semibold text-white/90">
              {t.reviewBody} <span className="text-[#d4af37]">*</span>
            </label>
            <textarea
              value={reviewBody}
              onChange={(e) => {
                setReviewBody(e.target.value);
                if (errors.reviewBody) {
                  setErrors({ ...errors, reviewBody: "" });
                }
              }}
              placeholder={t.placeholderBody}
              rows={6}
              className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-white placeholder-white/30 focus:border-[#d4af37]/50 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/20 focus:bg-white/10 transition-all duration-300 resize-none"
            />
            {errors.reviewBody && (
              <p className="mt-2 text-sm text-red-400/80">{errors.reviewBody}</p>
            )}
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 font-semibold text-white hover:bg-white/10 hover:border-white/30 transition-all duration-300"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-xl bg-gradient-to-r from-[#d4af37] to-[#f4d03f] px-6 py-3.5 font-semibold text-black transition-all duration-300 hover:from-[#f4d03f] hover:to-[#d4af37] shadow-lg shadow-[#d4af37]/20 hover:shadow-[#d4af37]/30 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isSubmitting ? "送信中..." : existingReview ? t.update : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

