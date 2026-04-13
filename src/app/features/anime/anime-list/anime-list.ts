import { Component, computed, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { getNewestDateTimestamp } from '../../../core/date-sort.utils';
import {
  getCoveredYears,
  getSortedUniqueValues,
  matchesAnySelection,
  removeValueFromSet,
  toggleValueInSet
} from '../../../core/filter.utils';
import { ActiveFilterChipsComponent } from '../../../shared/filters/active-filter-chips/active-filter-chips';
import { FilterDropdownComponent } from '../../../shared/filters/filter-dropdown/filter-dropdown';
import { ActiveFilterChip, FilterOption } from '../../../shared/filters/filter.models';
import { AnimeService } from '../anime.service';
import { Anime } from '../anime.model';

@Component({
  selector: 'app-anime-list',
  imports: [RouterLink, FilterDropdownComponent, ActiveFilterChipsComponent],
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
    getSortedUniqueValues(this.sortedAnime().map((anime: Anime) => anime.status))
  );
  protected readonly ratingOptions = computed(() =>
    getSortedUniqueValues(this.sortedAnime().map((anime: Anime) => anime.rating), true)
  );

  protected readonly releaseYearOptions = computed(() =>
    getSortedUniqueValues(this.sortedAnime().map((anime: Anime) => anime.releaseYear), true)
  );

  protected readonly watchedYearOptions = computed(() => {
    const years = new Set<string>();
    for (const watchedYears of this.watchedYearsByAnimeId().values()) {
      for (const year of watchedYears) {
        years.add(year);
      }
    }
    return getSortedUniqueValues(Array.from(years), true);
  });
  protected readonly statusFacetCounts = computed(() => this.getFacetCounts('status'));
  protected readonly ratingFacetCounts = computed(() => this.getFacetCounts('rating'));
  protected readonly releaseYearFacetCounts = computed(() => this.getFacetCounts('releaseYear'));
  protected readonly watchedYearFacetCounts = computed(() => this.getFacetCounts('watchedYear'));
  protected readonly statusFilterOptions = computed<FilterOption[]>(() =>
    this.statusOptions().map((status) => ({
      value: status,
      label: this.formatStatusLabel(status),
      count: this.statusFacetCounts().get(status) ?? 0,
      selected: this.selectedStatuses().has(status)
    }))
  );
  protected readonly ratingFilterOptions = computed<FilterOption[]>(() =>
    this.ratingOptions().map((rating) => ({
      value: rating,
      label: rating,
      count: this.ratingFacetCounts().get(rating) ?? 0,
      selected: this.selectedRatings().has(rating)
    }))
  );
  protected readonly releaseYearFilterOptions = computed<FilterOption[]>(() =>
    this.releaseYearOptions().map((releaseYear) => ({
      value: releaseYear,
      label: releaseYear,
      count: this.releaseYearFacetCounts().get(releaseYear) ?? 0,
      selected: this.selectedReleaseYears().has(releaseYear)
    }))
  );
  protected readonly watchedYearFilterOptions = computed<FilterOption[]>(() =>
    this.watchedYearOptions().map((watchedYear) => ({
      value: watchedYear,
      label: watchedYear,
      count: this.watchedYearFacetCounts().get(watchedYear) ?? 0,
      selected: this.selectedWatchedYears().has(watchedYear)
    }))
  );
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
    this.selectedStatuses.update((selected) => toggleValueInSet(selected, value));
  }

  protected toggleRating(value: string): void {
    this.selectedRatings.update((selected) => toggleValueInSet(selected, value));
  }

  protected toggleReleaseYear(value: string): void {
    this.selectedReleaseYears.update((selected) => toggleValueInSet(selected, value));
  }

  protected toggleWatchedYear(value: string): void {
    this.selectedWatchedYears.update((selected) => toggleValueInSet(selected, value));
  }

  protected getSelectedCount(values: Set<string>): number {
    return values.size;
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
      this.selectedStatuses.update((selected) => removeValueFromSet(selected, chip.value));
      return;
    }

    if (chip.type === 'rating') {
      this.selectedRatings.update((selected) => removeValueFromSet(selected, chip.value));
      return;
    }

    if (chip.type === 'releaseYear') {
      this.selectedReleaseYears.update((selected) => removeValueFromSet(selected, chip.value));
      return;
    }

    this.selectedWatchedYears.update((selected) => removeValueFromSet(selected, chip.value));
  }

  protected formatStatusLabel(status: string): string {
    return status.replace('-', ' ');
  }

  protected getStatusBadgeClasses(status: string): string {
    const normalizedStatus = status.trim().toLowerCase().replace('_', '-').replace(' ', '-');

    if (normalizedStatus === 'completed') {
      return 'bg-blue-100 text-blue-700';
    }

    if (normalizedStatus === 'watching') {
      return 'bg-green-100 text-green-700';
    }

    if (normalizedStatus === 'dropped') {
      return 'bg-red-100 text-red-700';
    }

    if (normalizedStatus === 'on-hold') {
      return 'bg-orange-100 text-orange-700';
    }

    return 'bg-gray-100 text-gray-700';
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
      ignoreFilter === 'status' || matchesAnySelection(this.selectedStatuses(), anime.status);
    if (!matchesStatus) return false;

    const matchesRating =
      ignoreFilter === 'rating' || matchesAnySelection(this.selectedRatings(), anime.rating);
    if (!matchesRating) return false;

    const matchesReleaseYear =
      ignoreFilter === 'releaseYear' ||
      matchesAnySelection(this.selectedReleaseYears(), anime.releaseYear);
    if (!matchesReleaseYear) return false;

    if (ignoreFilter === 'watchedYear') return true;
    const watchedYears = this.watchedYearsByAnimeId().get(anime.id) ?? new Set<string>();
    return matchesAnySelection(this.selectedWatchedYears(), watchedYears);
  }

  private getWatchedYears(anime: Anime): Set<string> {
    return getCoveredYears([
      { startDate: anime.startDate, endDate: anime.endDate },
      ...(anime.additionalDates ?? []).map((additionalDate) => ({
        startDate: additionalDate.startDate,
        endDate: additionalDate.endDate
      }))
    ]);
  }

  private closeOpenFilterDropdowns(): void {
    const container = this.filtersContainer()?.nativeElement;
    if (!container) return;

    for (const detailElement of container.querySelectorAll('details[open]')) {
      detailElement.removeAttribute('open');
    }
  }
}
