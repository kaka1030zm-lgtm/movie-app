// ジャンルの型定義
export interface Genre {
  id: number;
  name: string;
}

// キャスト・スタッフの型定義
export interface Person {
  id: number;
  name: string;
  profile_path: string | null;
}

// 映画検索結果の型定義
export interface MovieSearchResult {
  id: number;
  title: string;
  poster_path: string | null;
  release_date: string | null;
  overview: string | null;
  vote_average?: number;
  popularity?: number;
  genres?: Genre[];
  director?: Person | null;
  cast?: Person[];
  media_type?: "movie" | "tv";
}

// 評価項目の型定義
export interface RatingCriteria {
  story: number; // ストーリー (1-10)
  acting: number; // 演技 (1-10)
  direction: number; // 演出 (1-10)
  cinematography: number; // 映像美 (1-10)
  music: number; // 音楽 (1-10)
  overall: number; // 総合評価 (1-10)
}

// レビューの型定義
export interface Review {
  id: string;
  movie_id: number;
  movie_title: string;
  movie_poster_path: string | null;
  movie_release_date: string | null;
  ratings: RatingCriteria;
  overall_star_rating: number; // 総合評価を星評価に変換 (0.5-5.0、0.1単位)
  comment: string | null;
  created_at: string;
  updated_at: string;
}

// レビュー作成用の型定義
export interface ReviewInput {
  movie_id: number;
  movie_title: string;
  movie_poster_path: string | null;
  movie_release_date: string | null;
  ratings: RatingCriteria;
  comment: string | null;
}
