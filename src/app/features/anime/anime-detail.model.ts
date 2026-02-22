import { Anime } from './anime.model';

export interface AnimeDetail {
  description: string;
  opinion: string;
  trivia: string;
  malID: string;
}

/** Anime document with its Details subcollection data (for detail view). */
export type AnimeWithDetails = (Anime & { details: AnimeDetail }) | null;
