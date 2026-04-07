import { Component, input, output } from '@angular/core';
import { FilterOption } from '../filter.models';

@Component({
  selector: 'app-filter-dropdown',
  standalone: true,
  templateUrl: './filter-dropdown.html'
})
export class FilterDropdownComponent {
  readonly label = input.required<string>();
  readonly selectedCount = input(0);
  readonly options = input<FilterOption[]>([]);
  readonly panelWidthClass = input('w-52');

  readonly optionToggled = output<string>();
  readonly dropdownToggled = output<Event>();

  protected onOptionChange(value: string): void {
    this.optionToggled.emit(value);
  }

  protected onToggle(event: Event): void {
    this.dropdownToggled.emit(event);
  }
}
