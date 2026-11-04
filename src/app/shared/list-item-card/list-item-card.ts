import { Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  formatStatusLabel,
  getRatingBadgeClasses,
  getStatusBadgeClasses,
  isPerfectRating
} from '../badge-styles.utils';

/** Grid card used by the anime and games lists. */
@Component({
  selector: 'app-list-item-card',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './list-item-card.html',
  host: { class: 'block h-full' }
})
export class ListItemCardComponent {
  readonly link = input.required<string[]>();
  readonly coverURL = input.required<string>();
  /** Full Tailwind aspect-ratio class, e.g. "aspect-[290/410]". */
  readonly coverAspectClass = input.required<string>();
  readonly name = input.required<string>();
  readonly subtitle = input.required<string>();
  readonly status = input.required<string>();
  readonly progress = input<string | undefined>();
  readonly startDate = input.required<string>();
  readonly endDate = input<string | undefined>();
  readonly rating = input<string | null | undefined>();
  /** Position in the list; drives lazy loading and the staggered animation. */
  readonly index = input.required<number>();

  protected readonly statusLabel = computed(() => formatStatusLabel(this.status()));
  protected readonly statusClasses = computed(() => getStatusBadgeClasses(this.status()));
  protected readonly ratingClasses = computed(() => getRatingBadgeClasses(this.rating()));
  protected readonly isPerfect = computed(() => isPerfectRating(this.rating()));
}
