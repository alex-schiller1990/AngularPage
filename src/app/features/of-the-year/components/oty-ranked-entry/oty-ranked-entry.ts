import { Component, input } from '@angular/core';
import { DisplayEntry } from '../../of-the-year-detail/of-the-year-detail';

// Tailwind color token for the placement badge (e.g. 'red', 'yellow', 'green', 'purple')
export type BadgeColor = 'red' | 'yellow' | 'green' | 'purple';

const BADGE_CLASSES: Record<BadgeColor, string> = {
  red: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
  green: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
};

@Component({
  selector: 'app-oty-ranked-entry',
  standalone: true,
  templateUrl: './oty-ranked-entry.html',
})
export class OtyRankedEntryComponent {
  readonly item = input.required<DisplayEntry>();
  readonly badgeColor = input<BadgeColor>('green');

  protected get badgeClass(): string {
    return BADGE_CLASSES[this.badgeColor()];
  }
}
