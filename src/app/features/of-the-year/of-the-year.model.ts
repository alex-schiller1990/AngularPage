export interface OtyEntry {
  name: string;
  url?: string;
  cover?: string;
  placement?: string; // stored as a string in Firestore, e.g. "4"
  description?: string;
}

export interface OtySection {
  intro?: string;
  entry?: OtyEntry[];
  honorableMentions?: OtyEntry[];
}

export interface OfTheYearReview {
  id: string;
  type: 'aoty' | 'goty';
  year: string;
  intro?: string;
  disappointments?: OtySection;
  surprises?: OtySection;
  highlights?: OtySection;
  mostWanted?: OtySection;
  outro?: string;
}

export interface OfTheYearIndex {
  years: string[];
  covers: Record<string, string>;
}
