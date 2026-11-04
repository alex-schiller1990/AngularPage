import { Component, ElementRef, HostListener, inject, input, output, viewChild } from '@angular/core';
import { ActiveFilterChipsComponent } from '../active-filter-chips/active-filter-chips';
import { ActiveFilterChip } from '../filter.models';

/**
 * Search box, projected filter controls (dropdowns, sort), "Clear all", active chips and result count.
 * Keeps at most one projected filter dropdown open and closes them on outside click or Escape.
 */
@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [ActiveFilterChipsComponent],
  templateUrl: './filter-bar.html',
  host: { class: 'block' }
})
export class FilterBarComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly filtersContainer = viewChild<ElementRef<HTMLElement>>('filtersContainer');

  readonly searchQuery = input.required<string>();
  readonly chips = input<ActiveFilterChip[]>([]);
  readonly resultCount = input.required<number>();

  readonly searchQueryChange = output<string>();
  readonly clearAll = output<void>();
  readonly chipRemoved = output<ActiveFilterChip>();

  constructor() {
    // "toggle" does not bubble, so listen in the capture phase to see events from projected dropdowns.
    this.host.nativeElement.addEventListener('toggle', (event) => this.closeOtherDropdowns(event), true);
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const container = this.filtersContainer()?.nativeElement;
    const target = event.target as Node | null;
    if (!container || !target || container.contains(target)) return;
    this.closeDropdowns();
  }

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    this.closeDropdowns();
  }

  private closeOtherDropdowns(event: Event): void {
    const opened = event.target as HTMLDetailsElement | null;
    if (!opened?.open) return;
    this.closeDropdowns(opened);
  }

  private closeDropdowns(except?: Element): void {
    const container = this.filtersContainer()?.nativeElement;
    if (!container) return;

    for (const detailElement of container.querySelectorAll('details[open]')) {
      if (detailElement !== except) {
        detailElement.removeAttribute('open');
      }
    }
  }
}
