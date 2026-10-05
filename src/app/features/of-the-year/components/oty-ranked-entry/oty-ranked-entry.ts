import { Component, input } from '@angular/core';
import { DisplayEntry } from '../../of-the-year-detail/of-the-year-detail';

// Semantic placement badge variants
export type BadgePlacement = 'first' | 'second' | 'third' | 'other';

const BADGE_CLASSES: Record<BadgePlacement, string> = {
  first: 'badge badge-placement--first',
  second: 'badge badge-placement--second',
  third: 'badge badge-placement--third',
  other: 'badge badge-placement--other',
};

@Component({
  selector: 'app-oty-ranked-entry',
  standalone: true,
  templateUrl: './oty-ranked-entry.html',
})
export class OtyRankedEntryComponent {
  readonly item = input.required<DisplayEntry>();
  readonly badgePlacement = input<BadgePlacement>('other');

  protected get badgeClass(): string {
    return BADGE_CLASSES[this.badgePlacement()];
  }
}
