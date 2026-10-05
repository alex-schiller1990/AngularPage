import { Component } from '@angular/core';
import { YearReviewGrid } from '../../of-the-year/year-review-grid/year-review-grid';

@Component({
  selector: 'app-games-year-review',
  imports: [YearReviewGrid],
  template: `
    <app-year-review-grid
      indexKey="goty"
      newRoute="/goty/new"
      aspectRatio="aspect-[290/435]"
      placeholderColor="placeholder-brand-strong"
      description="Browse game year reviews."
    />
  `,
  standalone: true
})
export class GamesYearReview {}
