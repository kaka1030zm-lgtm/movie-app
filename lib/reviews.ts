// レビュー管理のユーティリティ
import { Review, ReviewInput, RatingCriteria } from "@/types/movie";

const STORAGE_KEY = "movie_ratings_reviews";

// 総合評価（1-10）を星評価（1-5）に変換（0.1単位）
export function convertToStarRating(overallRating: number): number {
  // 10段階を5段階に変換（0.1単位で）
  // 1-10の範囲を0.5-5.0の範囲に線形変換
  const starRating = (overallRating / 10) * 5;
  // 0.1単位で丸める
  return Math.round(starRating * 10) / 10;
}

// 評価項目の平均を計算
export function calculateOverallRating(ratings: RatingCriteria): number {
  const values = [
    ratings.story,
    ratings.acting,
    ratings.direction,
    ratings.cinematography,
    ratings.music,
  ];
  const sum = values.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / values.length);
}

// レビューを保存（ローカルストレージ）
export function saveReview(reviewInput: ReviewInput): Review {
  const overallRating = calculateOverallRating(reviewInput.ratings);
  const starRating = convertToStarRating(overallRating);

  const review: Review = {
    id: crypto.randomUUID(),
    movie_id: reviewInput.movie_id,
    movie_title: reviewInput.movie_title,
    movie_poster_path: reviewInput.movie_poster_path,
    movie_release_date: reviewInput.movie_release_date,
    ratings: reviewInput.ratings,
    overall_star_rating: starRating,
    comment: reviewInput.comment,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const reviews = getAllReviews();
  reviews.push(review);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));

  return review;
}

// すべてのレビューを取得
export function getAllReviews(): Review[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error("Error loading reviews:", error);
    return [];
  }
}

// レビューを更新
export function updateReview(reviewId: string, reviewInput: ReviewInput): Review | null {
  const reviews = getAllReviews();
  const index = reviews.findIndex((r) => r.id === reviewId);

  if (index === -1) return null;

  const overallRating = calculateOverallRating(reviewInput.ratings);
  const starRating = convertToStarRating(overallRating);

  const updatedReview: Review = {
    ...reviews[index],
    ...reviewInput,
    ratings: reviewInput.ratings,
    overall_star_rating: starRating,
    updated_at: new Date().toISOString(),
  };

  reviews[index] = updatedReview;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews));

  return updatedReview;
}

// レビューを削除
export function deleteReview(reviewId: string): boolean {
  const reviews = getAllReviews();
  const filtered = reviews.filter((r) => r.id !== reviewId);

  if (filtered.length === reviews.length) return false;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

// 映画IDでレビューを取得
export function getReviewByMovieId(movieId: number): Review | null {
  const reviews = getAllReviews();
  return reviews.find((r) => r.movie_id === movieId) || null;
}


