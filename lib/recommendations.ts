// おすすめ映画のロジック
import { MovieSearchResult } from "@/types/movie";
import { getWatchlist } from "./watchlist";
import { TMDBMovie, getMovieDetails, discoverMoviesByGenres } from "./tmdb";

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// 見たいリストからジャンルIDと公開日を抽出（統計を取る）
export async function extractGenresAndDatesFromWatchlist(
  watchlist?: { id: number; media_type?: "movie" | "tv" }[]
): Promise<{
  genreIds: number[];
  genreCounts: Map<number, number>;
  releaseDates: string[];
}> {
  // 見たいリストが渡されていない場合はローカルストレージから取得
  const items = watchlist || getWatchlist();
  console.log(`Extracting genres and dates from ${items.length} watchlist items`);
  
  const genreIds = new Set<number>();
  const genreCounts = new Map<number, number>();
  const releaseDates: string[] = [];

  // 見たいリストの全映画の詳細を取得してジャンルと公開日を収集
  const promises = items.map(async (item) => {
    try {
      const details = await getMovieDetails(item.id, item.media_type || "movie");
      if (details.genres && details.genres.length > 0) {
        details.genres.forEach((genre) => {
          genreIds.add(genre.id);
          genreCounts.set(genre.id, (genreCounts.get(genre.id) || 0) + 1);
        });
      }
      // 公開日を収集（release_dateまたはfirst_air_date）
      const releaseDate = details.release_date || details.first_air_date;
      if (releaseDate) {
        releaseDates.push(releaseDate);
      }
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error(`Error fetching details for movie ${item.id}:`, error);
      }
    }
  });

  await Promise.all(promises);
  
  return {
    genreIds: Array.from(genreIds),
    genreCounts,
    releaseDates,
  };
}

// おすすめ映画を取得（見たいリストのジャンルと公開日ベース）
export async function getRecommendedMovies(
  excludeMovieIds: number[] = [],
  watchlist?: { id: number; media_type?: "movie" | "tv" }[]
): Promise<MovieSearchResult[]> {
  // 見たいリストが渡されていない場合はローカルストレージから取得
  const items = watchlist || getWatchlist();

  try {
    // 見たいリストが空の場合は空配列を返す（フォールバックは呼び出し側で処理）
    if (items.length === 0) {
      console.log("Watchlist is empty, returning empty array");
      return [];
    }

    // ジャンルIDと公開日を抽出（統計を取る）
    const { genreIds, genreCounts, releaseDates } = await extractGenresAndDatesFromWatchlist(items);

    if (genreIds.length === 0) {
      console.warn("No genres found in watchlist");
      return [];
    }
    
    console.log(`Using ${genreIds.length} genres for recommendations`);

    // 公開日の範囲を計算（前後10年に拡大してより多くの結果を取得）
    let primaryReleaseDateGte: string | undefined;
    let primaryReleaseDateLte: string | undefined;
    
    if (releaseDates.length > 0) {
      const years = releaseDates
        .map((date) => new Date(date).getFullYear())
        .filter((year) => !isNaN(year));
      
      if (years.length > 0) {
        const minYear = Math.min(...years);
        const maxYear = Math.max(...years);
        // 前後10年の範囲に拡大（より多くの結果を取得するため）
        primaryReleaseDateGte = `${minYear - 10}-01-01`;
        primaryReleaseDateLte = `${maxYear + 10}-12-31`;
      }
    }

    // ジャンルを頻度順にソート（最も多いジャンルを優先）
    const sortedGenres = Array.from(genreIds).sort((a, b) => {
      const countA = genreCounts.get(a) || 0;
      const countB = genreCounts.get(b) || 0;
      return countB - countA;
    });

    // ジャンルベースで映画を検索（複数ページ取得して30件確保）
    const allMovies: TMDBMovie[] = [];
    const maxPages = 5; // より多くのページを取得（3→5に増加）
    
    for (let page = 1; page <= maxPages; page++) {
      const movies = await discoverMoviesByGenres(
        sortedGenres,
        excludeMovieIds,
        page,
        primaryReleaseDateGte,
        primaryReleaseDateLte
      );
      allMovies.push(...movies);
      
      // 30件集まったら終了
      if (allMovies.length >= 30) {
        break;
      }
      
      // 結果が0件の場合は次のページに進む
      if (movies.length === 0) {
        continue;
      }
    }

    // 重複を除外し、ジャンルのマッチ数でソート（Setを使用して高速化）
    const excludeIdsSet = new Set(excludeMovieIds);
    const uniqueMovies = allMovies
      .filter((movie, index, self) => 
        index === self.findIndex((m) => m.id === movie.id) &&
        !excludeIdsSet.has(movie.id)
      )
      .map((movie) => {
        // ジャンルのマッチ数を計算
        const movieGenreIds = movie.genres?.map((g) => g.id) || movie.genre_ids || [];
        const matchCount = movieGenreIds.filter((gId) => genreIds.includes(gId)).length;
        return { movie, matchCount };
      })
      // ジャンルのマッチ数が多い順、次に人気順でソート
      .sort((a, b) => {
        if (b.matchCount !== a.matchCount) {
          return b.matchCount - a.matchCount;
        }
        return (b.movie.popularity || 0) - (a.movie.popularity || 0);
      })
      .map(({ movie }) => movie);

    // 結果が少ない場合は、公開日の範囲を緩和して再検索
    if (uniqueMovies.length < 10) {
      // 公開日の範囲を緩和して再検索（公開日フィルターなし）
      const relaxedMovies: TMDBMovie[] = [];
      for (let page = 1; page <= 3; page++) {
        const movies = await discoverMoviesByGenres(
          sortedGenres,
          excludeMovieIds,
          page,
          undefined, // primaryReleaseDateGte なし
          undefined  // primaryReleaseDateLte なし
        );
        relaxedMovies.push(...movies);
        if (relaxedMovies.length >= 30) break;
      }
      
      const relaxedUnique = relaxedMovies
        .filter((movie, index, self) => 
          index === self.findIndex((m) => m.id === movie.id) &&
          !excludeIdsSet.has(movie.id)
        )
        .map((movie) => {
          const movieGenreIds = movie.genres?.map((g) => g.id) || movie.genre_ids || [];
          const matchCount = movieGenreIds.filter((gId) => genreIds.includes(gId)).length;
          return { movie, matchCount };
        })
        .sort((a, b) => {
          if (b.matchCount !== a.matchCount) {
            return b.matchCount - a.matchCount;
          }
          return (b.movie.popularity || 0) - (a.movie.popularity || 0);
        })
        .map(({ movie }) => movie);
      
      // 既存の結果とマージして重複を除去
      const merged = [...uniqueMovies, ...relaxedUnique]
        .filter((movie, index, self) => 
          index === self.findIndex((m) => m.id === movie.id)
        )
        .slice(0, 30);
      
      return merged.map((movie: TMDBMovie) => ({
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
    }
    
    // 30件に満たない場合は空配列を返す（呼び出し側でフォールバック処理）
    return uniqueMovies.slice(0, 30).map((movie: TMDBMovie) => ({
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


