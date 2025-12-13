// おすすめ映画のロジック
import { MovieSearchResult } from "@/types/movie";
import { getWatchlist } from "./watchlist";
import { TMDBMovie, getMovieDetails, discoverMoviesByGenres } from "./tmdb";

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// 見たいリストからジャンルIDを抽出
export async function extractGenresFromWatchlist(): Promise<number[]> {
  const watchlist = getWatchlist();
  const genreIds = new Set<number>();

  // 見たいリストの各映画の詳細を取得してジャンルを収集
  const promises = watchlist.slice(0, 5).map(async (item) => {
    try {
      const details = await getMovieDetails(item.id, item.media_type || "movie");
      if (details.genres) {
        details.genres.forEach((genre) => genreIds.add(genre.id));
      }
    } catch (error) {
      console.error(`Error fetching details for movie ${item.id}:`, error);
    }
  });

  await Promise.all(promises);
  return Array.from(genreIds);
}

// おすすめ映画を取得（見たいリストのジャンルベース）
export async function getRecommendedMovies(
  excludeMovieIds: number[] = []
): Promise<MovieSearchResult[]> {
  const watchlist = getWatchlist();

  if (watchlist.length === 0) {
    return [];
  }

  try {
    // ジャンルIDを抽出
    const genreIds = await extractGenresFromWatchlist();

    if (genreIds.length === 0) {
      return [];
    }

    // ジャンルベースで映画を検索
    const movies = await discoverMoviesByGenres(genreIds, excludeMovieIds);

    return movies.map((movie: TMDBMovie) => ({
      id: movie.id,
      title: movie.title || movie.name || "",
      poster_path: movie.poster_path,
      release_date: movie.release_date || movie.first_air_date || null,
      overview: movie.overview,
      vote_average: movie.vote_average,
      popularity: movie.popularity,
      genres: movie.genres,
      media_type: movie.media_type as "movie" | "tv",
    }));
  } catch (error) {
    console.error("Error fetching recommendations:", error);
    return [];
  }
}
