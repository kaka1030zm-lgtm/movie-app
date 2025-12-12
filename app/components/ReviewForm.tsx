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
      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-300">{label}</label>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((rating) => (
            <button
              key={rating}
              type="button"
              onClick={() => onChange(rating)}
              onMouseEnter={() => setHoveredRating({ ...hoveredRating, [fieldName]: rating })}
              onMouseLeave={() => setHoveredRating({ ...hoveredRating, [fieldName]: 0 })}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={`h-6 w-6 transition-colors ${
                  rating <= hoveredValue
                    ? "fill-yellow-500 text-yellow-500"
                    : rating <= value
                    ? "fill-amber-400 text-amber-400"
                    : "text-zinc-600"
                }`}
              />
            </button>
          ))}
          <span className="ml-2 text-sm text-zinc-400">{value}/5</span>
        </div>
      </div>
    );
  };

  if (!movie) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="mb-6 flex items-center gap-4">
          {movie.poster_path ? (
            <img
              src={`https://image.tmdb.org/t/p/w154${movie.poster_path}`}
              alt={movie.title || movie.name}
              className="h-24 w-16 rounded object-cover"
            />
          ) : (
            <div className="flex h-24 w-16 items-center justify-center rounded bg-zinc-800">
              <span className="text-2xl">🎬</span>
            </div>
          )}
          <div>
            <h2 className="text-xl font-bold text-white">{movie.title || movie.name}</h2>
            <p className="text-sm text-zinc-400">
              {movie.release_date || movie.first_air_date || ""}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* レビュータイトル */}
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              レビュータイトル <span className="text-red-400">*</span>
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
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
            {errors.reviewTitle && (
              <p className="mt-1 text-sm text-red-400">{errors.reviewTitle}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              {t.platform}
            </label>
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
              {PLATFORMS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlatform(p.id)}
                  className={`flex flex-col items-center gap-1 rounded-lg border p-2 transition-colors ${
                    platform === p.id
                      ? "border-amber-400 bg-amber-400/10"
                      : "border-zinc-700 bg-zinc-800/50 hover:border-zinc-600"
                  }`}
                >
                  <img src={p.logo} alt={p.name} className="h-6 w-6 object-contain" />
                  <span className="text-xs text-zinc-300">{p.name}</span>
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
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              {t.reviewBody} <span className="text-red-400">*</span>
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
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
            {errors.reviewBody && (
              <p className="mt-1 text-sm text-red-400">{errors.reviewBody}</p>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-white transition-colors hover:bg-zinc-700"
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 rounded-lg bg-amber-400 px-4 py-2 font-medium text-black transition-colors hover:bg-amber-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "送信中..." : existingReview ? t.update : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

