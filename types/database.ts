export interface Database {
  public: {
    Tables: {
      reviews: {
        Row: {
          id: string;
          movie_id: number;
          title: string;
          poster_path: string | null;
          overall_rating: number;
          criteria_ratings: {
            plot: number;
            acting: number;
            pacing: number;
            cinematography: number;
            writing: number;
            ending: number;
          };
          review_text: string | null;
          watched_date: string | null;
          platform: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          movie_id: number;
          title: string;
          poster_path?: string | null;
          overall_rating: number;
          criteria_ratings: {
            plot: number;
            acting: number;
            pacing: number;
            cinematography: number;
            writing: number;
            ending: number;
          };
          review_text?: string | null;
          watched_date?: string | null;
          platform?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          movie_id?: number;
          title?: string;
          poster_path?: string | null;
          overall_rating?: number;
          criteria_ratings?: {
            plot?: number;
            acting?: number;
            pacing?: number;
            cinematography?: number;
            writing?: number;
            ending?: number;
          };
          review_text?: string | null;
          watched_date?: string | null;
          platform?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type ReviewInsert = Database["public"]["Tables"]["reviews"]["Insert"];
export type ReviewUpdate = Database["public"]["Tables"]["reviews"]["Update"];
