/** Subset of Jikan v4 GET /anime/{id} response used on the detail page. */
export interface JikanAnimeApiResponse {
  data: JikanAnimeApiData;
}

export interface JikanAnimeApiData {
  url: string;
  titles: { type: string; title: string }[];
  score: number | null;
  scored_by: number | null;
  rank: number | null;
  popularity: number | null;
  aired: {
    from: string | null;
    to: string | null;
    prop: {
      from: JikanAiredDatePart;
      to: JikanAiredDatePart;
    };
  };
  duration: string | null;
  source: string | null;
  genres: { name: string }[];
  studios: { name: string }[];
}

export interface JikanAiredDatePart {
  day: number | null;
  month: number | null;
  year: number | null;
}

/** Mapped view model for the anime-detail template. */
export interface JikanAnimeView {
  malUrl: string;
  /** All MAL titles joined for display (comma-separated). */
  synonyms: string;
  score: number | null;
  scoredBy: number | null;
  rank: number | null;
  popularity: number | null;
  airedFrom: string | null;
  airedTo: string | null;
  duration: string | null;
  source: string | null;
  genres: string[];
  studios: string[];
}
