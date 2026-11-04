import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/auth/auth.service';
import {
  getCoveredYears,
  getSortedUniqueValues,
  matchesAnySelection,
  removeValueFromSet,
  toggleValueInSet
} from '../../../core/filter.utils';
import { SORT_OPTIONS, SortOption, sortItems } from '../../../core/sort.utils';
import { formatStatusLabel } from '../../../shared/badge-styles.utils';
import { FilterBarComponent } from '../../../shared/filters/filter-bar/filter-bar';
import { FilterDropdownComponent } from '../../../shared/filters/filter-dropdown/filter-dropdown';
import { toFilterOptions } from '../../../shared/filters/filter-options.utils';
import { ActiveFilterChip } from '../../../shared/filters/filter.models';
import { SortSelectComponent } from '../../../shared/filters/sort-select/sort-select';
import { ListItemCardComponent } from '../../../shared/list-item-card/list-item-card';
import { GamesService } from '../games.service';
import { Game } from '../game.model';
import { GamesYearReview } from '../games-year-review/games-year-review';

@Component({
  selector: 'app-games-list',
  imports: [
    RouterLink,
    FilterBarComponent,
    FilterDropdownComponent,
    SortSelectComponent,
    ListItemCardComponent,
    GamesYearReview
  ],
  templateUrl: './games-list.html',
  styleUrl: './games-list.css',
  standalone: true
})
export class GamesList {
  protected readonly gamesService = inject(GamesService);
  protected readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly queryParamMap = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap
  });
  protected readonly activeTab = computed(() =>
    this.queryParamMap().get('tab') === 'year-review' ? 'year-review' : 'list'
  );
  protected readonly searchQuery = signal('');
  protected readonly selectedStatuses = signal<Set<string>>(new Set());
  protected readonly selectedRatings = signal<Set<string>>(new Set());
  protected readonly selectedReleaseYears = signal<Set<string>>(new Set());
  protected readonly selectedPlayedYears = signal<Set<string>>(new Set());
  protected readonly selectedPlatforms = signal<Set<string>>(new Set());
  protected readonly sortOption = signal<SortOption>('date-desc');
  protected readonly sortOptions = SORT_OPTIONS;

  /** Games sorted by the selected sort option (default: newest date first). */
  protected readonly sortedGames = computed(() => sortItems(this.gamesService.list(), this.sortOption()));

  private readonly playedYearsByGameId = computed(() => {
    const map = new Map<string, Set<string>>();
    for (const game of this.sortedGames()) {
      map.set(game.id, this.getPlayedYears(game));
    }
    return map;
  });

  private readonly statusOptions = computed(() =>
    getSortedUniqueValues(this.sortedGames().map((game: Game) => game.status))
  );

  private readonly ratingOptions = computed(() =>
    getSortedUniqueValues(this.sortedGames().map((game: Game) => game.rating), true)
  );

  private readonly releaseYearOptions = computed(() =>
    getSortedUniqueValues(this.sortedGames().map((game: Game) => game.releaseYear), true)
  );

  private readonly playedYearOptions = computed(() => {
    const years = new Set<string>();
    for (const playedYears of this.playedYearsByGameId().values()) {
      for (const year of playedYears) {
        years.add(year);
      }
    }
    return getSortedUniqueValues(Array.from(years), true);
  });

  private readonly platformOptions = computed(() =>
    getSortedUniqueValues(this.sortedGames().flatMap((game: Game) => this.getPlatformValues(game.platform)))
  );

  protected readonly statusFilterOptions = computed(() =>
    toFilterOptions(
      this.statusOptions(),
      this.getFacetCounts('status'),
      this.selectedStatuses(),
      formatStatusLabel
    )
  );
  protected readonly ratingFilterOptions = computed(() =>
    toFilterOptions(this.ratingOptions(), this.getFacetCounts('rating'), this.selectedRatings())
  );
  protected readonly releaseYearFilterOptions = computed(() =>
    toFilterOptions(this.releaseYearOptions(), this.getFacetCounts('releaseYear'), this.selectedReleaseYears())
  );
  protected readonly playedYearFilterOptions = computed(() =>
    toFilterOptions(this.playedYearOptions(), this.getFacetCounts('playedYear'), this.selectedPlayedYears())
  );
  protected readonly platformFilterOptions = computed(() =>
    toFilterOptions(this.platformOptions(), this.getFacetCounts('platform'), this.selectedPlatforms())
  );
  protected readonly activeFilterChips = computed<ActiveFilterChip[]>(() => {
    const chips: ActiveFilterChip[] = [];
    const query = this.searchQuery().trim();
    if (query) {
      chips.push({ type: 'search', value: query, label: `Search: ${query}` });
    }

    for (const status of Array.from(this.selectedStatuses()).sort((a, b) => a.localeCompare(b))) {
      chips.push({ type: 'status', value: status, label: `Status: ${formatStatusLabel(status)}` });
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

  protected switchTab(tab: 'list' | 'year-review'): void {
    this.router.navigate([], { queryParams: { tab } });
  }

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

  protected refreshList(): void {
    this.gamesService.refreshList();
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
}
