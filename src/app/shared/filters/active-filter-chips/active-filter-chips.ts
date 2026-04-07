import { Component, input, output } from '@angular/core';
import { ActiveFilterChip } from '../filter.models';

@Component({
  selector: 'app-active-filter-chips',
  standalone: true,
  templateUrl: './active-filter-chips.html'
})
export class ActiveFilterChipsComponent {
  readonly chips = input<ActiveFilterChip[]>([]);
  readonly chipRemoved = output<ActiveFilterChip>();

  protected onRemoveChip(chip: ActiveFilterChip): void {
    this.chipRemoved.emit(chip);
  }
}
