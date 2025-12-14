// データベースを使用したレビュー管理
import { prisma } from "@/lib/prisma";
import { Review, ReviewInput, RatingCriteria } from "@/types/movie";
import { calculateOverallRating, convertToStarRating } from "./reviews";

// レビューを保存（データベース）
export async function saveReviewDB(userId: string, reviewInput: ReviewInput): Promise<Review> {
  const overallRating = calculateOverallRating(reviewInput.ratings);
  const starRating = convertToStarRating(overallRating);

  const review = await prisma.review.upsert({
    where: {
      userId_movieId: {
        userId,
        movieId: reviewInput.movie_id,
      },
    },
    update: {
      movieTitle: reviewInput.movie_title,
      moviePosterPath: reviewInput.movie_poster_path,
      movieReleaseDate: reviewInput.movie_release_date,
      ratings: JSON.stringify(reviewInput.ratings),
      overallStarRating: starRating,
      comment: reviewInput.comment,
      updatedAt: new Date(),
    },
    create: {
      userId,
      movieId: reviewInput.movie_id,
      movieTitle: reviewInput.movie_title,
      moviePosterPath: reviewInput.movie_poster_path,
      movieReleaseDate: reviewInput.movie_release_date,
      ratings: JSON.stringify(reviewInput.ratings),
      overallStarRating: starRating,
      comment: reviewInput.comment,
    },
  });

  return {
    id: review.id,
    movie_id: review.movieId,
    movie_title: review.movieTitle,
    movie_poster_path: review.moviePosterPath,
    movie_release_date: review.movieReleaseDate,
    ratings: JSON.parse(review.ratings) as RatingCriteria,
    overall_star_rating: review.overallStarRating,
    comment: review.comment,
    created_at: review.createdAt.toISOString(),
    updated_at: review.updatedAt.toISOString(),
  };
}

// すべてのレビューを取得
export async function getAllReviewsDB(userId: string): Promise<Review[]> {
  const reviews = await prisma.review.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return reviews.map((review) => ({
    id: review.id,
    movie_id: review.movieId,
    movie_title: review.movieTitle,
    movie_poster_path: review.moviePosterPath,
    movie_release_date: review.movieReleaseDate,
    ratings: JSON.parse(review.ratings) as RatingCriteria,
    overall_star_rating: review.overallStarRating,
    comment: review.comment,
    created_at: review.createdAt.toISOString(),
    updated_at: review.updatedAt.toISOString(),
  }));
}

// レビューを更新
export async function updateReviewDB(
  userId: string,
  reviewId: string,
  reviewInput: ReviewInput
): Promise<Review | null> {
  const overallRating = calculateOverallRating(reviewInput.ratings);
  const starRating = convertToStarRating(overallRating);

  const review = await prisma.review.updateMany({
    where: {
      id: reviewId,
      userId, // ユーザーIDも確認
    },
    data: {
      movieTitle: reviewInput.movie_title,
      moviePosterPath: reviewInput.movie_poster_path,
      movieReleaseDate: reviewInput.movie_release_date,
      ratings: JSON.stringify(reviewInput.ratings),
      overallStarRating: starRating,
      comment: reviewInput.comment,
      updatedAt: new Date(),
    },
  });

  if (review.count === 0) return null;

  const updated = await prisma.review.findUnique({
    where: { id: reviewId },
  });

  if (!updated) return null;

  return {
    id: updated.id,
    movie_id: updated.movieId,
    movie_title: updated.movieTitle,
    movie_poster_path: updated.moviePosterPath,
    movie_release_date: updated.movieReleaseDate,
    ratings: JSON.parse(updated.ratings) as RatingCriteria,
    overall_star_rating: updated.overallStarRating,
    comment: updated.comment,
    created_at: updated.createdAt.toISOString(),
    updated_at: updated.updatedAt.toISOString(),
  };
}

// レビューを削除
export async function deleteReviewDB(userId: string, reviewId: string): Promise<boolean> {
  const result = await prisma.review.deleteMany({
    where: {
      id: reviewId,
      userId, // ユーザーIDも確認
    },
  });

  return result.count > 0;
}

// 映画IDでレビューを取得
export async function getReviewByMovieIdDB(
  userId: string,
  movieId: number
): Promise<Review | null> {
  const review = await prisma.review.findUnique({
    where: {
      userId_movieId: {
        userId,
        movieId,
      },
    },
  });

  if (!review) return null;

  return {
    id: review.id,
    movie_id: review.movieId,
    movie_title: review.movieTitle,
    movie_poster_path: review.moviePosterPath,
    movie_release_date: review.movieReleaseDate,
    ratings: JSON.parse(review.ratings) as RatingCriteria,
    overall_star_rating: review.overallStarRating,
    comment: review.comment,
    created_at: review.createdAt.toISOString(),
    updated_at: review.updatedAt.toISOString(),
  };
}
