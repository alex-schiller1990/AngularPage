import { Component, computed, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { getNewestDateTimestamp } from '../../../core/date-sort.utils';
import { AnimeService } from '../anime.service';
import { Anime } from '../anime.model';

interface ActiveFilterChip {
  type: 'search' | 'status' | 'rating' | 'releaseYear' | 'watchedYear';
  value: string;
  label: string;
}

@Component({
  selector: 'app-anime-list',
  imports: [RouterLink],
  templateUrl: './anime-list.html',
  styleUrl: './anime-list.css',
  standalone: true
})
export class AnimeList {
  protected readonly animeService = inject(AnimeService);
  protected readonly searchQuery = signal('');
  protected readonly filtersContainer = viewChild<ElementRef<HTMLElement>>('filtersContainer');
  protected readonly selectedStatuses = signal<Set<string>>(new Set());
  protected readonly selectedRatings = signal<Set<string>>(new Set());
  protected readonly selectedReleaseYears = signal<Set<string>>(new Set());
  protected readonly selectedWatchedYears = signal<Set<string>>(new Set());

  /** Anime sorted by newest date (last watched) descending; unknown dates last. */
  protected readonly sortedAnime = computed(() => {
    const list = this.animeService.list();
    return [...list].sort((a: Anime, b: Anime) => getNewestDateTimestamp(b) - getNewestDateTimestamp(a));
  });

  private readonly watchedYearsByAnimeId = computed(() => {
    const map = new Map<string, Set<string>>();
    for (const anime of this.sortedAnime()) {
      map.set(anime.id, this.getWatchedYears(anime));
    }
    return map;
  });

  protected readonly statusOptions = computed(() =>
    this.getSortedUniqueValues(this.sortedAnime().map((anime: Anime) => anime.status))
  );
  protected readonly ratingOptions = computed(() =>
    this.getSortedUniqueValues(this.sortedAnime().map((anime: Anime) => anime.rating), true)
  );

  protected readonly releaseYearOptions = computed(() =>
    this.getSortedUniqueValues(this.sortedAnime().map((anime: Anime) => anime.releaseYear), true)
  );

  protected readonly watchedYearOptions = computed(() => {
    const years = new Set<string>();
    for (const watchedYears of this.watchedYearsByAnimeId().values()) {
      for (const year of watchedYears) {
        years.add(year);
      }
    }
    return this.getSortedUniqueValues(Array.from(years), true);
  });
  protected readonly statusFacetCounts = computed(() => this.getFacetCounts('status'));
  protected readonly ratingFacetCounts = computed(() => this.getFacetCounts('rating'));
  protected readonly releaseYearFacetCounts = computed(() => this.getFacetCounts('releaseYear'));
  protected readonly watchedYearFacetCounts = computed(() => this.getFacetCounts('watchedYear'));
  protected readonly activeFilterChips = computed<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];
    const query = this.searchQuery().trim();
    if (query) {
      chips.push({ type: 'search', value: query, label: `Search: ${query}` });
    }

    for (const status of Array.from(this.selectedStatuses()).sort((a, b) => a.localeCompare(b))) {
      chips.push({ type: 'status', value: status, label: `Status: ${this.formatStatusLabel(status)}` });
    }
    for (const rating of Array.from(this.selectedRatings()).sort((a, b) => Number(b) - Number(a))) {
      chips.push({ type: 'rating', value: rating, label: `Rating: ${rating}` });
    }
    for (const releaseYear of Array.from(this.selectedReleaseYears()).sort((a, b) => Number(b) - Number(a))) {
      chips.push({ type: 'releaseYear', value: releaseYear, label: `Release: ${releaseYear}` });
    }
    for (const watchedYear of Array.from(this.selectedWatchedYears()).sort((a, b) => Number(b) - Number(a))) {
      chips.push({ type: 'watchedYear', value: watchedYear, label: `Watched: ${watchedYear}` });
    }

    return chips;
  });

  protected readonly filteredAnime = computed(() => {
    return this.sortedAnime().filter((anime: Anime) => this.matchesAllFilters(anime));
  });

  protected toggleStatus(value: string): void {
    this.selectedStatuses.update((selected) => this.toggleValueInSet(selected, value));
  }

  protected toggleRating(value: string): void {
    this.selectedRatings.update((selected) => this.toggleValueInSet(selected, value));
  }

  protected toggleReleaseYear(value: string): void {
    this.selectedReleaseYears.update((selected) => this.toggleValueInSet(selected, value));
  }

  protected toggleWatchedYear(value: string): void {
    this.selectedWatchedYears.update((selected) => this.toggleValueInSet(selected, value));
  }

  protected isStatusSelected(value: string): boolean {
    return this.selectedStatuses().has(value);
  }

  protected isRatingSelected(value: string): boolean {
    return this.selectedRatings().has(value);
  }

  protected isReleaseYearSelected(value: string): boolean {
    return this.selectedReleaseYears().has(value);
  }

  protected isWatchedYearSelected(value: string): boolean {
    return this.selectedWatchedYears().has(value);
  }

  protected getSelectedCount(values: Set<string>): number {
    return values.size;
  }

  protected getOptionCount(counts: Map<string, number>, value: string): number {
    return counts.get(value) ?? 0;
  }

  protected clearAllFilters(): void {
    this.searchQuery.set('');
    this.selectedStatuses.set(new Set());
    this.selectedRatings.set(new Set());
    this.selectedReleaseYears.set(new Set());
    this.selectedWatchedYears.set(new Set());
  }

  protected removeFilterChip(chip: ActiveFilterChip): void {
    if (chip.type === 'search') {
      this.searchQuery.set('');
      return;
    }

    if (chip.type === 'status') {
      this.selectedStatuses.update((selected) => this.removeValueFromSet(selected, chip.value));
      return;
    }

    if (chip.type === 'rating') {
      this.selectedRatings.update((selected) => this.removeValueFromSet(selected, chip.value));
      return;
    }

    if (chip.type === 'releaseYear') {
      this.selectedReleaseYears.update((selected) => this.removeValueFromSet(selected, chip.value));
      return;
    }

    this.selectedWatchedYears.update((selected) => this.removeValueFromSet(selected, chip.value));
  }

  protected formatStatusLabel(status: string): string {
    return status.replace('-', ' ');
  }

  @HostListener('document:click', ['$event'])
  protected onDocumentClick(event: MouseEvent): void {
    const container = this.filtersContainer()?.nativeElement;
    const target = event.target as Node | null;
    if (!container || !target || container.contains(target)) return;
    this.closeOpenFilterDropdowns();
  }

  @HostListener('document:keydown.escape')
  protected onEscapeKey(): void {
    this.closeOpenFilterDropdowns();
  }

  protected onFilterDropdownToggle(event: Event): void {
    const openedDropdown = event.currentTarget as HTMLDetailsElement | null;
    if (!openedDropdown?.open) return;

    const container = this.filtersContainer()?.nativeElement;
    if (!container) return;

    for (const detailElement of container.querySelectorAll('details[open]')) {
      if (detailElement !== openedDropdown) {
        detailElement.removeAttribute('open');
      }
    }
  }

  private getSortedUniqueValues(
    values: Array<string | undefined | null>,
    sortDescendingAsNumber = false
  ): string[] {
    const uniqueValues = Array.from(
      new Set(
        values
          .filter((value): value is string => typeof value === 'string')
          .map((value: string) => value.trim())
          .filter((value: string) => value !== '')
      )
    );

    if (sortDescendingAsNumber) {
      return uniqueValues.sort((a: string, b: string) => Number(b) - Number(a));
    }
    return uniqueValues.sort((a: string, b: string) => a.localeCompare(b));
  }

  private getFacetCounts(
    facet: 'status' | 'rating' | 'releaseYear' | 'watchedYear'
  ): Map<string, number> {
    const counts = new Map<string, number>();

    for (const anime of this.sortedAnime()) {
      if (!this.matchesAllFilters(anime, facet)) continue;

      if (facet === 'watchedYear') {
        const watchedYears = this.watchedYearsByAnimeId().get(anime.id) ?? new Set<string>();
        for (const year of watchedYears) {
          counts.set(year, (counts.get(year) ?? 0) + 1);
        }
        continue;
      }

      const value =
        facet === 'status'
          ? anime.status
          : facet === 'rating'
            ? anime.rating
            : anime.releaseYear;

      if (typeof value !== 'string') continue;
      const normalized = value.trim();
      if (!normalized) continue;

      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }

    return counts;
  }

  private matchesAllFilters(
    anime: Anime,
    ignoreFilter?: 'status' | 'rating' | 'releaseYear' | 'watchedYear'
  ): boolean {
    const query = this.searchQuery().trim().toLowerCase();
    const matchesName = anime.name.toLowerCase().includes(query);
    const matchesAlternativeTitle = anime.alternativeTitles?.some((title: string) =>
      title.toLowerCase().includes(query)
    );
    const matchesSearch = !query || matchesName || !!matchesAlternativeTitle;
    if (!matchesSearch) return false;

    const matchesStatus =
      ignoreFilter === 'status' || this.matchesAnySelection(this.selectedStatuses(), anime.status);
    if (!matchesStatus) return false;

    const matchesRating =
      ignoreFilter === 'rating' || this.matchesAnySelection(this.selectedRatings(), anime.rating);
    if (!matchesRating) return false;

    const matchesReleaseYear =
      ignoreFilter === 'releaseYear' ||
      this.matchesAnySelection(this.selectedReleaseYears(), anime.releaseYear);
    if (!matchesReleaseYear) return false;

    if (ignoreFilter === 'watchedYear') return true;
    const watchedYears = this.watchedYearsByAnimeId().get(anime.id) ?? new Set<string>();
    return this.matchesAnySelection(this.selectedWatchedYears(), watchedYears);
  }

  private matchesAnySelection(
    selectedValues: Set<string>,
    value: string | number | Set<string> | undefined | null
  ): boolean {
    if (selectedValues.size === 0) return true;
    if (value == null) return false;

    if (typeof value === 'string' || typeof value === 'number') {
      return selectedValues.has(String(value).trim());
    }

    if (!(value instanceof Set)) return false;

    for (const selected of selectedValues) {
      if (value.has(selected)) return true;
    }
    return false;
  }

  private toggleValueInSet(currentSet: Set<string>, value: string): Set<string> {
    const nextSet = new Set(currentSet);
    if (nextSet.has(value)) {
      nextSet.delete(value);
    } else {
      nextSet.add(value);
    }
    return nextSet;
  }

  private removeValueFromSet(currentSet: Set<string>, value: string): Set<string> {
    const nextSet = new Set(currentSet);
    nextSet.delete(value);
    return nextSet;
  }

  private getWatchedYears(anime: Anime): Set<string> {
    const watchedYears = new Set<string>();

    this.addYearsFromRange(anime.startDate, anime.endDate, watchedYears);
    for (const additionalDate of anime.additionalDates ?? []) {
      this.addYearsFromRange(additionalDate.startDate, additionalDate.endDate, watchedYears);
    }

    return watchedYears;
  }

  private addYearsFromRange(startDate: string | undefined, endDate: string | undefined, years: Set<string>): void {
    const startYear = this.getYearFromDate(startDate);
    if (startYear == null) return;

    const endYear = this.getYearFromDate(endDate) ?? startYear;
    const minYear = Math.min(startYear, endYear);
    const maxYear = Math.max(startYear, endYear);

    for (let year = minYear; year <= maxYear; year++) {
      years.add(String(year));
    }
  }

  private getYearFromDate(value: string | undefined): number | null {
    if (value == null || value.trim() === '') return null;

    const normalized = value.replaceAll('?', '0').trim();
    const parts = normalized.split('.');
    if (parts.length !== 3) return null;

    const year = Number(parts[2]);
    return Number.isFinite(year) && year > 0 ? year : null;
  }

  private closeOpenFilterDropdowns(): void {
    const container = this.filtersContainer()?.nativeElement;
    if (!container) return;

    for (const detailElement of container.querySelectorAll('details[open]')) {
      detailElement.removeAttribute('open');
    }
  }
}
