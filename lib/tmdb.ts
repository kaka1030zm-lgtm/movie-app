// TMDB API関連のユーティリティ

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY;
const TMDB_BASE_URL = "https://api.themoviedb.org/3";
const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBPerson {
  id: number;
  name: string;
  profile_path: string | null;
  job?: string; // クルー用
}

export interface TMDBMovie {
  id: number;
  title?: string;
  name?: string; // TV用
  poster_path: string | null;
  release_date?: string | null;
  first_air_date?: string | null; // TV用
  overview: string | null;
  vote_average?: number;
  popularity?: number;
  genres?: TMDBGenre[];
  genre_ids?: number[];
  media_type?: "movie" | "tv" | "person";
}

export interface TMDBProvider {
  provider_id: number;
  provider_name: string;
  logo_path: string | null;
}

export interface TMDBWatchProviders {
  results?: {
    JP?: {
      flatrate?: TMDBProvider[];
      buy?: TMDBProvider[];
      rent?: TMDBProvider[];
    };
  };
}

export interface TMDBMovieDetails extends TMDBMovie {
  genres: TMDBGenre[];
  backdrop_path?: string | null;
  credits?: {
    cast: TMDBPerson[];
    crew: TMDBPerson[];
  };
  watch_providers?: TMDBWatchProviders;
}

export interface TMDBSearchResponse {
  results: TMDBMovie[];
  total_results: number;
  total_pages: number;
  page: number;
}

// ポスターURLを生成
export function getPosterUrl(posterPath: string | null | undefined): string | null {
  if (!posterPath || posterPath.trim() === "") {
    return null;
  }
  if (posterPath.startsWith("http://") || posterPath.startsWith("https://")) {
    return posterPath;
  }
  return `${TMDB_IMAGE_BASE}${posterPath}`;
}

// バックドロップURLを生成
export function getBackdropUrl(backdropPath: string | null | undefined): string | null {
  if (!backdropPath || backdropPath.trim() === "") {
    return null;
  }
  if (backdropPath.startsWith("http://") || backdropPath.startsWith("https://")) {
    return backdropPath;
  }
  return `https://image.tmdb.org/t/p/w1280${backdropPath}`;
}

// 全メディアタイプで検索（映画・ドラマ）
export async function searchMulti(
  query: string,
  page: number = 1,
  genreId?: number,
  year?: number
): Promise<TMDBSearchResponse> {
  if (!TMDB_API_KEY) {
    throw new Error("TMDB API key is not set");
  }

  let url = `${TMDB_BASE_URL}/search/multi?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&language=ja-JP&page=${page}`;
  
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`);
  }

  const data = await response.json();
  
  // 人気順でソート
  if (data.results) {
    data.results.sort((a: TMDBMovie, b: TMDBMovie) => 
      (b.popularity || 0) - (a.popularity || 0)
    );
  }

  return data;
}

// 映画を検索（後方互換性のため残す）
export async function searchMovies(query: string, page: number = 1): Promise<TMDBSearchResponse> {
  return searchMulti(query, page);
}

// 人気映画を取得（上位30位 = 2ページ分）
export async function getPopularMovies(region?: string): Promise<TMDBMovie[]> {
  if (!TMDB_API_KEY) {
    throw new Error("TMDB API key is not set");
  }

  // regionが指定されている場合は、/discover/movieを使用してより確実に取得
  if (region) {
    try {
      // 複数ページを取得して30件確保
      const allMovies: any[] = [];
      for (let page = 1; page <= 3; page++) {
        const response = await fetch(
          `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=ja-JP&region=${region}&sort_by=popularity.desc&page=${page}`
        );
        
        if (response.ok) {
          const data = await response.json();
          allMovies.push(...(data.results || []));
          if (allMovies.length >= 30) break;
        } else {
          console.error(`Failed to fetch page ${page}: ${response.statusText}`);
        }
      }
      
      return allMovies.slice(0, 30).map((movie: any) => ({
        ...movie,
        media_type: movie.media_type || "movie",
      }));
    } catch (error) {
      console.error("Error using discover endpoint, falling back to popular:", error);
      // フォールバック: /movie/popularを使用
    }
  }

  // regionが指定されていない場合、またはdiscoverが失敗した場合
  const regionParam = region ? `&region=${region}` : "";
  const [page1, page2] = await Promise.all([
    fetch(
      `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=ja-JP&page=1${regionParam}`
    ),
    fetch(
      `${TMDB_BASE_URL}/movie/popular?api_key=${TMDB_API_KEY}&language=ja-JP&page=2${regionParam}`
    ),
  ]);

  if (!page1.ok || !page2.ok) {
    throw new Error(`TMDB API error`);
  }

  const data1 = await page1.json();
  const data2 = await page2.json();

  // 2ページ分を結合して30件返す
  const allMovies = [...(data1.results || []), ...(data2.results || [])];
  return allMovies.slice(0, 30).map((movie) => ({
    ...movie,
    media_type: movie.media_type || "movie",
  }));
}

// 人気ドラマを取得（上位30位 = 2ページ分）
// regionが指定されている場合、origin_countryでフィルタリング
export async function getPopularTVShows(region?: string): Promise<TMDBMovie[]> {
  if (!TMDB_API_KEY) {
    throw new Error("TMDB API key is not set");
  }

  // TV/popularはregionパラメータをサポートしていないため、全件取得してからフィルタリング
  const [page1, page2] = await Promise.all([
    fetch(
      `${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&language=ja-JP&page=1`
    ),
    fetch(
      `${TMDB_BASE_URL}/tv/popular?api_key=${TMDB_API_KEY}&language=ja-JP&page=2`
    ),
  ]);

  if (!page1.ok || !page2.ok) {
    throw new Error(`TMDB API error`);
  }

  const data1 = await page1.json();
  const data2 = await page2.json();

  // 2ページ分を結合
  let allTVShows = [...(data1.results || []), ...(data2.results || [])];

  // regionが指定されている場合、origin_countryでフィルタリング
  if (region) {
    allTVShows = allTVShows.filter((tv: any) => 
      tv.origin_country && tv.origin_country.includes(region)
    );
  }

  // 30件に制限
  return allTVShows.slice(0, 30).map((tv: any) => ({
    ...tv,
    media_type: "tv",
    title: tv.name || tv.title || "",
    release_date: tv.first_air_date || tv.release_date || null,
    origin_country: tv.origin_country || [],
  }));
}

// ジャンルIDで映画を検索
export async function discoverMoviesByGenres(
  genreIds: number[],
  excludeMovieIds: number[] = [],
  page: number = 1,
  primaryReleaseDateGte?: string,
  primaryReleaseDateLte?: string
): Promise<TMDBMovie[]> {
  if (!TMDB_API_KEY || genreIds.length === 0) {
    return [];
  }

  // 最大3つのジャンルを使用（最も頻度の高いジャンルを優先）
  const topGenres = genreIds.slice(0, 3);
  const genreParam = topGenres.join(",");
  let url = `${TMDB_BASE_URL}/discover/movie?api_key=${TMDB_API_KEY}&language=ja-JP&with_genres=${genreParam}&sort_by=popularity.desc&page=${page}`;
  
  if (primaryReleaseDateGte) {
    url += `&primary_release_date.gte=${primaryReleaseDateGte}`;
  }
  if (primaryReleaseDateLte) {
    url += `&primary_release_date.lte=${primaryReleaseDateLte}`;
  }
  
  console.log(`Discovering movies with genres: ${topGenres.join(", ")}, date range: ${primaryReleaseDateGte} to ${primaryReleaseDateLte}`);

  const response = await fetch(url);

  if (!response.ok) {
    console.error(`TMDB API error: ${response.statusText}`);
    return [];
  }

  const data = await response.json();
  return (data.results || [])
    .filter((movie: TMDBMovie) => !excludeMovieIds.includes(movie.id))
    .map((movie: TMDBMovie) => ({
      ...movie,
      media_type: movie.media_type || "movie",
    }));
}

// 映画詳細を取得（ジャンル、監督、主演、配信情報含む）
export async function getMovieDetails(
  movieId: number,
  mediaType: "movie" | "tv" = "movie"
): Promise<TMDBMovieDetails> {
  if (!TMDB_API_KEY) {
    throw new Error("TMDB API key is not set");
  }

  const [detailsResponse, creditsResponse, watchProvidersResponse] = await Promise.all([
    fetch(
      `${TMDB_BASE_URL}/${mediaType}/${movieId}?api_key=${TMDB_API_KEY}&language=ja-JP`
    ),
    fetch(
      `${TMDB_BASE_URL}/${mediaType}/${movieId}/credits?api_key=${TMDB_API_KEY}&language=ja-JP`
    ),
    fetch(
      `${TMDB_BASE_URL}/${mediaType}/${movieId}/watch/providers?api_key=${TMDB_API_KEY}`
    ),
  ]);

  if (!detailsResponse.ok) {
    throw new Error(`TMDB API error: ${detailsResponse.statusText}`);
  }

  const details = await detailsResponse.json();
  const credits = creditsResponse.ok ? await creditsResponse.json() : null;
  const watchProviders = watchProvidersResponse.ok ? await watchProvidersResponse.json() : null;

  return {
    ...details,
    credits: credits || undefined,
    watch_providers: watchProviders || undefined,
  };
}

// ジャンル一覧を取得
export async function getGenres(mediaType: "movie" | "tv" = "movie"): Promise<{ id: number; name: string }[]> {
  if (!TMDB_API_KEY) {
    throw new Error("TMDB API key is not set");
  }

  const response = await fetch(
    `${TMDB_BASE_URL}/genre/${mediaType}/list?api_key=${TMDB_API_KEY}&language=ja-JP`
  );

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`);
  }

  const data = await response.json();
  return data.genres || [];
}

// 配信プロバイダー一覧を取得（日本のプロバイダー）
export async function getWatchProviders(mediaType: "movie" | "tv" = "movie"): Promise<TMDBProvider[]> {
  if (!TMDB_API_KEY) {
    throw new Error("TMDB API key is not set");
  }

  const response = await fetch(
    `${TMDB_BASE_URL}/watch/providers/${mediaType}?api_key=${TMDB_API_KEY}&watch_region=JP`
  );

  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.statusText}`);
  }

  const data = await response.json();
  // flatrate（サブスクリプション）のみを返す
  const providers: TMDBProvider[] = [];
  if (data.results) {
    data.results.forEach((provider: any) => {
      if (provider.display_priority <= 20) { // 主要なプロバイダーのみ
        providers.push({
          provider_id: provider.provider_id,
          provider_name: provider.provider_name,
          logo_path: provider.logo_path,
        });
      }
    });
  }
  // 表示優先度でソート
  return providers.sort((a, b) => {
    const priorityA = data.results.find((p: any) => p.provider_id === a.provider_id)?.display_priority || 999;
    const priorityB = data.results.find((p: any) => p.provider_id === b.provider_id)?.display_priority || 999;
    return priorityA - priorityB;
  });
}


