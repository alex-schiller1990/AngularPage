import { Component, input, output } from '@angular/core';
import { SortOption } from '../../../core/sort.utils';

@Component({
  selector: 'app-sort-select',
  standalone: true,
  templateUrl: './sort-select.html'
})
export class SortSelectComponent {
  readonly options = input.required<{ value: SortOption; label: string }[]>();
  readonly value = input.required<SortOption>();

  readonly valueChange = output<SortOption>();

  protected onChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.valueChange.emit(select.value as SortOption);
  }
}
