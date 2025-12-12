export interface MovieSearchResult {
  id: number;
  title: string;
  original_title?: string;
  name?: string;
  original_name?: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date?: string;
  first_air_date?: string;
  media_type?: "movie" | "tv";
  vote_average: number;
  genre_ids?: number[];
}

export interface ReviewRecord {
  id: string;
  movieId: number;
  title: string;
  originalTitle?: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate?: string;
  mediaType: "movie" | "tv";
  platform: string;
  reviewTitle: string; // レビューのタイトル
  story: number;
  acting: number;
  visuals: number;
  music: number;
  originality: number;
  emotional: number;
  reviewBody: string;
  userId?: string; // ユーザーID（認証用）
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistItem {
  id: number;
  title: string;
  originalTitle?: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate?: string;
  mediaType: "movie" | "tv";
  addedAt: string;
}

