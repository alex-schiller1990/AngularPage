/** Subset of RapidAPI OpenCritic GET /game/{id} response used on the detail page. */
export interface OpenCriticApiGame {
  topCriticScore: number;
  numReviews: number;
  firstReleaseDate: string;
  Platforms: { name: string }[];
  Genres: { name: string }[];
  Companies: { name: string; type: string }[];
}

/** Mapped view model for OpenCritic data on the game detail page. */
export interface OpenCriticGameView {
  topCriticScore: number | null;
  numReviews: number;
  firstReleaseDate: string | null;
  platforms: string[];
  genres: string[];
  developer: string | null;
  publisher: string | null;
}
