import { Component } from '@angular/core';
import { YearReviewGrid } from '../../of-the-year/year-review-grid/year-review-grid';

@Component({
  selector: 'app-anime-year-review',
  imports: [YearReviewGrid],
  template: `
    <app-year-review-grid
      indexKey="aoty"
      newRoute="/aoty/new"
      aspectRatio="aspect-[290/410]"
      placeholderColor="placeholder-brand"
      description="Browse anime year reviews."
    />
  `,
  standalone: true
})
export class AnimeYearReview {}
