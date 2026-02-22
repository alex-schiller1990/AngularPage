import { AdditionalDate } from '../../core/additional-date.model';

export interface Game {
  id: string;
  name: string;
  title: string;
  alternativeTitles?: string[];
  coverURL: string;
  status: 'playing' | 'completed' | 'dropped' | 'on-hold' | 'played';
  progress?: string;
  startDate: string;
  endDate?: string;
  additionalDates?: AdditionalDate[];
  rating?: string;
  releaseYear: string;
  platform: string;
}
