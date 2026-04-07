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
import { GamesService } from '../games.service';
import { Game } from '../game.model';

@Component({
  selector: 'app-games-list',
  imports: [RouterLink, FilterDropdownComponent, ActiveFilterChipsComponent],
  templateUrl: './games-list.html',
  styleUrl: './games-list.css',
  standalone: true
})
export class GamesList {
  protected readonly gamesService = inject(GamesService);
  protected readonly searchQuery = signal('');
  protected readonly filtersContainer = viewChild<ElementRef<HTMLElement>>('filtersContainer');
  protected readonly selectedStatuses = signal<Set<string>>(new Set());
  protected readonly selectedRatings = signal<Set<string>>(new Set());
  protected readonly selectedReleaseYears = signal<Set<string>>(new Set());
  protected readonly selectedPlayedYears = signal<Set<string>>(new Set());
  protected readonly selectedPlatforms = signal<Set<string>>(new Set());

  /** Games sorted by newest date (last played) descending; unknown dates last. */
  protected readonly sortedGames = computed(() => {
    const list = this.gamesService.list();
    return [...list].sort((a: Game, b: Game) => getNewestDateTimestamp(b) - getNewestDateTimestamp(a));
  });

  private readonly playedYearsByGameId = computed(() => {
    const map = new Map<string, Set<string>>();
    for (const game of this.sortedGames()) {
      map.set(game.id, this.getPlayedYears(game));
    }
    return map;
  });

  protected readonly statusOptions = computed(() =>
    getSortedUniqueValues(this.sortedGames().map((game: Game) => game.status))
  );

  protected readonly ratingOptions = computed(() =>
    getSortedUniqueValues(this.sortedGames().map((game: Game) => game.rating), true)
  );

  protected readonly releaseYearOptions = computed(() =>
    getSortedUniqueValues(this.sortedGames().map((game: Game) => game.releaseYear), true)
  );

  protected readonly playedYearOptions = computed(() => {
    const years = new Set<string>();
    for (const playedYears of this.playedYearsByGameId().values()) {
      for (const year of playedYears) {
        years.add(year);
      }
    }
    return getSortedUniqueValues(Array.from(years), true);
  });

  protected readonly platformOptions = computed(() =>
    getSortedUniqueValues(this.sortedGames().flatMap((game: Game) => this.getPlatformValues(game.platform)))
  );

  protected readonly statusFacetCounts = computed(() => this.getFacetCounts('status'));
  protected readonly ratingFacetCounts = computed(() => this.getFacetCounts('rating'));
  protected readonly releaseYearFacetCounts = computed(() => this.getFacetCounts('releaseYear'));
  protected readonly playedYearFacetCounts = computed(() => this.getFacetCounts('playedYear'));
  protected readonly platformFacetCounts = computed(() => this.getFacetCounts('platform'));
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
  protected readonly playedYearFilterOptions = computed<FilterOption[]>(() =>
    this.playedYearOptions().map((playedYear) => ({
      value: playedYear,
      label: playedYear,
      count: this.playedYearFacetCounts().get(playedYear) ?? 0,
      selected: this.selectedPlayedYears().has(playedYear)
    }))
  );
  protected readonly platformFilterOptions = computed<FilterOption[]>(() =>
    this.platformOptions().map((platform) => ({
      value: platform,
      label: platform,
      count: this.platformFacetCounts().get(platform) ?? 0,
      selected: this.selectedPlatforms().has(platform)
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
    for (const playedYear of Array.from(this.selectedPlayedYears()).sort((a, b) => Number(b) - Number(a))) {
      chips.push({ type: 'playedYear', value: playedYear, label: `Played: ${playedYear}` });
    }
    for (const platform of Array.from(this.selectedPlatforms()).sort((a, b) => a.localeCompare(b))) {
      chips.push({ type: 'platform', value: platform, label: `Platform: ${platform}` });
    }

    return chips;
  });

  protected readonly filteredGames = computed(() => {
    return this.sortedGames().filter((game: Game) => this.matchesAllFilters(game));
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

  protected togglePlayedYear(value: string): void {
    this.selectedPlayedYears.update((selected) => toggleValueInSet(selected, value));
  }

  protected togglePlatform(value: string): void {
    this.selectedPlatforms.update((selected) => toggleValueInSet(selected, value));
  }

  protected getSelectedCount(values: Set<string>): number {
    return values.size;
  }

  protected clearAllFilters(): void {
    this.searchQuery.set('');
    this.selectedStatuses.set(new Set());
    this.selectedRatings.set(new Set());
    this.selectedReleaseYears.set(new Set());
    this.selectedPlayedYears.set(new Set());
    this.selectedPlatforms.set(new Set());
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

    if (chip.type === 'playedYear') {
      this.selectedPlayedYears.update((selected) => removeValueFromSet(selected, chip.value));
      return;
    }

    this.selectedPlatforms.update((selected) => removeValueFromSet(selected, chip.value));
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

  private getFacetCounts(
    facet: 'status' | 'rating' | 'releaseYear' | 'playedYear' | 'platform'
  ): Map<string, number> {
    const counts = new Map<string, number>();

    for (const game of this.sortedGames()) {
      if (!this.matchesAllFilters(game, facet)) continue;

      if (facet === 'playedYear') {
        const playedYears = this.playedYearsByGameId().get(game.id) ?? new Set<string>();
        for (const year of playedYears) {
          counts.set(year, (counts.get(year) ?? 0) + 1);
        }
        continue;
      }

      const value =
        facet === 'status'
          ? game.status
          : facet === 'rating'
            ? game.rating
            : facet === 'releaseYear'
              ? game.releaseYear
              : game.platform;

      if (facet === 'platform') {
        for (const platform of this.getPlatformValues(value)) {
          counts.set(platform, (counts.get(platform) ?? 0) + 1);
        }
        continue;
      }

      if (typeof value !== 'string') continue;
      const normalized = value.trim();
      if (!normalized) continue;

      counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
    }

    return counts;
  }

  private matchesAllFilters(
    game: Game,
    ignoreFilter?: 'status' | 'rating' | 'releaseYear' | 'playedYear' | 'platform'
  ): boolean {
    const query = this.searchQuery().trim().toLowerCase();
    const matchesName = game.name.toLowerCase().includes(query);
    const matchesAlternativeTitle = game.alternativeTitles?.some((title: string) =>
      title.toLowerCase().includes(query)
    );
    const matchesSearch = !query || matchesName || !!matchesAlternativeTitle;
    if (!matchesSearch) return false;

    const matchesStatus =
      ignoreFilter === 'status' || matchesAnySelection(this.selectedStatuses(), game.status);
    if (!matchesStatus) return false;

    const matchesRating =
      ignoreFilter === 'rating' || matchesAnySelection(this.selectedRatings(), game.rating);
    if (!matchesRating) return false;

    const matchesReleaseYear =
      ignoreFilter === 'releaseYear' ||
      matchesAnySelection(this.selectedReleaseYears(), game.releaseYear);
    if (!matchesReleaseYear) return false;

    if (ignoreFilter !== 'playedYear') {
      const playedYears = this.playedYearsByGameId().get(game.id) ?? new Set<string>();
      const matchesPlayedYear = matchesAnySelection(this.selectedPlayedYears(), playedYears);
      if (!matchesPlayedYear) return false;
    }

    const gamePlatforms = new Set(this.getPlatformValues(game.platform));
    const matchesPlatform =
      ignoreFilter === 'platform' || matchesAnySelection(this.selectedPlatforms(), gamePlatforms);
    return matchesPlatform;
  }

  private getPlayedYears(game: Game): Set<string> {
    return getCoveredYears([
      { startDate: game.startDate, endDate: game.endDate },
      ...(game.additionalDates ?? []).map((additionalDate) => ({
        startDate: additionalDate.startDate,
        endDate: additionalDate.endDate
      }))
    ]);
  }

  private getPlatformValues(value: string | undefined | null): string[] {
    if (typeof value !== 'string') return [];

    return Array.from(
      new Set(
        value
          .split(',')
          .map((platform: string) => platform.trim())
          .filter((platform: string) => platform !== '')
      )
    );
  }

  private closeOpenFilterDropdowns(): void {
    const container = this.filtersContainer()?.nativeElement;
    if (!container) return;

    for (const detailElement of container.querySelectorAll('details[open]')) {
      detailElement.removeAttribute('open');
    }
  }
}
