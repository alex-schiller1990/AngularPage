import { Component, computed, ElementRef, HostListener, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { getNewestDateTimestamp } from '../../../core/date-sort.utils';
import { GamesService } from '../games.service';
import { Game } from '../game.model';

interface ActiveFilterChip {
  type: 'search' | 'status' | 'rating' | 'releaseYear' | 'playedYear' | 'platform';
  value: string;
  label: string;
}

@Component({
  selector: 'app-games-list',
  imports: [RouterLink],
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
    this.getSortedUniqueValues(this.sortedGames().map((game: Game) => game.status))
  );

  protected readonly ratingOptions = computed(() =>
    this.getSortedUniqueValues(this.sortedGames().map((game: Game) => game.rating), true)
  );

  protected readonly releaseYearOptions = computed(() =>
    this.getSortedUniqueValues(this.sortedGames().map((game: Game) => game.releaseYear), true)
  );

  protected readonly playedYearOptions = computed(() => {
    const years = new Set<string>();
    for (const playedYears of this.playedYearsByGameId().values()) {
      for (const year of playedYears) {
        years.add(year);
      }
    }
    return this.getSortedUniqueValues(Array.from(years), true);
  });

  protected readonly platformOptions = computed(() =>
    this.getSortedUniqueValues(this.sortedGames().flatMap((game: Game) => this.getPlatformValues(game.platform)))
  );

  protected readonly statusFacetCounts = computed(() => this.getFacetCounts('status'));
  protected readonly ratingFacetCounts = computed(() => this.getFacetCounts('rating'));
  protected readonly releaseYearFacetCounts = computed(() => this.getFacetCounts('releaseYear'));
  protected readonly playedYearFacetCounts = computed(() => this.getFacetCounts('playedYear'));
  protected readonly platformFacetCounts = computed(() => this.getFacetCounts('platform'));
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
    this.selectedStatuses.update((selected) => this.toggleValueInSet(selected, value));
  }

  protected toggleRating(value: string): void {
    this.selectedRatings.update((selected) => this.toggleValueInSet(selected, value));
  }

  protected toggleReleaseYear(value: string): void {
    this.selectedReleaseYears.update((selected) => this.toggleValueInSet(selected, value));
  }

  protected togglePlayedYear(value: string): void {
    this.selectedPlayedYears.update((selected) => this.toggleValueInSet(selected, value));
  }

  protected togglePlatform(value: string): void {
    this.selectedPlatforms.update((selected) => this.toggleValueInSet(selected, value));
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

  protected isPlayedYearSelected(value: string): boolean {
    return this.selectedPlayedYears().has(value);
  }

  protected isPlatformSelected(value: string): boolean {
    return this.selectedPlatforms().has(value);
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
    this.selectedPlayedYears.set(new Set());
    this.selectedPlatforms.set(new Set());
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

    if (chip.type === 'playedYear') {
      this.selectedPlayedYears.update((selected) => this.removeValueFromSet(selected, chip.value));
      return;
    }

    this.selectedPlatforms.update((selected) => this.removeValueFromSet(selected, chip.value));
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
      ignoreFilter === 'status' || this.matchesAnySelection(this.selectedStatuses(), game.status);
    if (!matchesStatus) return false;

    const matchesRating =
      ignoreFilter === 'rating' || this.matchesAnySelection(this.selectedRatings(), game.rating);
    if (!matchesRating) return false;

    const matchesReleaseYear =
      ignoreFilter === 'releaseYear' ||
      this.matchesAnySelection(this.selectedReleaseYears(), game.releaseYear);
    if (!matchesReleaseYear) return false;

    if (ignoreFilter !== 'playedYear') {
      const playedYears = this.playedYearsByGameId().get(game.id) ?? new Set<string>();
      const matchesPlayedYear = this.matchesAnySelection(this.selectedPlayedYears(), playedYears);
      if (!matchesPlayedYear) return false;
    }

    const gamePlatforms = new Set(this.getPlatformValues(game.platform));
    const matchesPlatform =
      ignoreFilter === 'platform' || this.matchesAnySelection(this.selectedPlatforms(), gamePlatforms);
    return matchesPlatform;
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

  private getPlayedYears(game: Game): Set<string> {
    const playedYears = new Set<string>();

    this.addYearsFromRange(game.startDate, game.endDate, playedYears);
    for (const additionalDate of game.additionalDates ?? []) {
      this.addYearsFromRange(additionalDate.startDate, additionalDate.endDate, playedYears);
    }

    return playedYears;
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
