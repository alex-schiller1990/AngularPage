export interface Anime {
  id: string;
  name: string;
  title: string;
  alternativeTitles: string[];
  coverURL: string;
  status: 'watching' | 'completed' | 'dropped' | 'on-hold';
  progress: string;
  startDate: string;
  endDate: string;
  rating: string;
  releaseYear: string;
}
