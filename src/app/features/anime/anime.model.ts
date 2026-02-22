import { AdditionalDate } from '../../core/additional-date.model';

export interface Anime {
  id: string;
  name: string;
  title: string;
  alternativeTitles: string[];
  coverURL: string;
  status: 'watching' | 'completed' | 'dropped' | 'on-hold';
  progress: string;
  startDate: string;
  endDate?: string;
  additionalDates?: AdditionalDate[];
  rating: string;
  releaseYear: string;
}
