import { Game } from './game.model';

export interface GameDetail {
  id: string;
  description: string;
  opinion?: string;
  trivia?: string;
  openCriticID?: string;
  openCriticURL?: string;
}

/** Game document with its Details subcollection data (for detail view). */
export type GameWithDetails = (Game & { details: GameDetail }) | null;
