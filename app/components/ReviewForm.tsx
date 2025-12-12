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

export default function ReviewForm({ movie, existingReview, onSave, onClose }: ReviewFormProps) {
  const { t } = useTranslation();
  const [platform, setPlatform] = useState(existingReview?.platform || "");
  const [story, setStory] = useState(existingReview?.story || 0);
  const [acting, setActing] = useState(existingReview?.acting || 0);
  const [visuals, setVisuals] = useState(existingReview?.visuals || 0);
  const [music, setMusic] = useState(existingReview?.music || 0);
  const [originality, setOriginality] = useState(existingReview?.originality || 0);
  const [emotional, setEmotional] = useState(existingReview?.emotional || 0);
  const [reviewBody, setReviewBody] = useState(existingReview?.reviewBody || "");

  useEffect(() => {
    if (existingReview) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!movie) return;

    onSave({
      movieId: movie.id,
      title: movie.title || movie.name || "",
      originalTitle: movie.original_title || movie.original_name,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      releaseDate: movie.release_date || movie.first_air_date,
      mediaType: movie.media_type || (movie.name ? "tv" : "movie"),
      platform,
      story,
      acting,
      visuals,
      music,
      originality,
      emotional,
      reviewBody,
    });
  };

  const RatingInput = ({
    label,
    value,
    onChange,
  }: {
    label: string;
    value: number;
    onChange: (value: number) => void;
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-300">{label}</label>
      <div className="flex items-center gap-2">
        {[1, 2, 3, 4, 5].map((rating) => (
          <button
            key={rating}
            type="button"
            onClick={() => onChange(rating)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`h-6 w-6 ${
                rating <= value ? "fill-amber-400 text-amber-400" : "text-zinc-600"
              }`}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-zinc-400">{value}/5</span>
      </div>
    </div>
  );

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
            <RatingInput label={t.story} value={story} onChange={setStory} />
            <RatingInput label={t.acting} value={acting} onChange={setActing} />
            <RatingInput label={t.visuals} value={visuals} onChange={setVisuals} />
            <RatingInput label={t.music} value={music} onChange={setMusic} />
            <RatingInput
              label={t.originality}
              value={originality}
              onChange={setOriginality}
            />
            <RatingInput label={t.emotional} value={emotional} onChange={setEmotional} />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-300">
              {t.reviewBody}
            </label>
            <textarea
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
              placeholder={t.placeholderBody}
              rows={6}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 p-3 text-white placeholder-zinc-500 focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20"
            />
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
              className="flex-1 rounded-lg bg-amber-400 px-4 py-2 font-medium text-black transition-colors hover:bg-amber-300"
            >
              {existingReview ? t.update : t.save}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

